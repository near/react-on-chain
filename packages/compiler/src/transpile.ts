import Babel from '@babel/standalone';
import type {
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Expression,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  ImportSpecifier,
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
  TSAsExpression,
  VariableDeclaration,
} from '@babel/types';
import { TrustMode } from '@bos-web-engine/common';

import { buildComponentFunctionName } from './component';
import { parseModuleImport } from './import';
import type { ImportExpression, ModuleExport, ModuleImport } from './types';

/**
 * Derive a BOS Component path from a relative import
 * @param componentPath poth of the Component importing another BOS Component via relative path
 * @param componentImport import metadata for the relative import
 */
export function deriveComponentPath(
  componentPath: string,
  componentImport: ModuleImport
) {
  const [author, component] = componentPath.split('/');
  const { modulePath } = componentImport;
  const importPathComponents = modulePath.split('/');
  const pathComponents = component.split('.');

  const parentCount = modulePath.startsWith('..')
    ? modulePath.split('..').length - 1
    : 0;

  return `${author}/${[
    ...pathComponents.slice(
      parentCount,
      pathComponents.length -
        importPathComponents.filter((p) => p.startsWith('.')).length
    ),
    ...importPathComponents.slice(1),
  ].join('.')}`;
}

/**
 * Determine whether a child Component is trusted and can be inlined within the current container
 * @param trustMode explicit trust mode provided for this child render
 * @param path child Component's path
 * @param isComponentPathTrusted flag indicating whether the child is implicitly trusted by virtue of being under a trusted root
 */
function isChildComponentTrusted(
  { trustMode, path }: { trustMode: string; path: string },
  isComponentPathTrusted?: (p: string) => boolean
) {
  // child is explicitly trusted by parent or constitutes a new trusted root
  if (trustMode === TrustMode.Trusted || trustMode === TrustMode.TrustAuthor) {
    return true;
  }

  // child is explicitly sandboxed
  if (trustMode === TrustMode.Sandboxed) {
    return false;
  }

  // if the Component is not explicitly trusted or sandboxed, use the parent's
  // predicate to determine whether the Component should be trusted
  if (isComponentPathTrusted) {
    return isComponentPathTrusted(path);
  }

  return false;
}

interface TranspileSourceParams {
  componentPath: string;
  source: string;
  isComponentPathTrusted?: (path: string) => boolean;
}

export function transpileSource({
  componentPath,
  source,
  isComponentPathTrusted,
}: TranspileSourceParams) {
  const exports: ModuleExport = { default: '', named: [] };
  const imports: ModuleImport[] = [];
  const componentReferences: { [component: string]: ModuleImport } = {};
  const children: {
    isTrusted: boolean;
    path: string;
    trustMode: string;
  }[] = [];

  const transformComponents = ({ types: t }: any) => ({
    visitor: {
      CallExpression(path: {
        node: {
          arguments: [Identifier | StringLiteral, ObjectExpression | undefined];
          callee: { object: Identifier; property: Identifier };
        };
      }) {
        const {
          arguments: args,
          callee: { object, property },
        } = path.node;

        const isCreateElement =
          object?.name === '__Preact' && property?.name === 'createElement';
        const isElement = t.isStringLiteral(args[0]);
        if (!isCreateElement || isElement) {
          return;
        }

        let [Component, props] = args as [Identifier, ObjectExpression];

        if (t.isNullLiteral(props)) {
          props = t.objectExpression([]);
          path.node.arguments[1] = props;
        }

        /**
         * FIXME referencing `arguments` only works when the Component rendering takes place within
         *  in a scope in which the correct props is bound to arguments[0], i.e. the Component's root
         *  scope - in the directly-returned JSX or an arrow function in the Component's root scope.
         *
         *  TODO the correct solution is for the parser to inject the __bweMeta reference into the Component
         *   props argument, but it would also need to be made accessible to the render site
         *
         *   TL; DR
         *   this preserves ancestry:
         *   import Y from './Y';
         *   export default function X() { return <Y />; }
         *
         *   this doesn't:
         *   import Y from './Y';
         *   const renderY = () => <Y />;
         *   export default function X() { return <>{renderY()}</> }
         */
        const propsAccessor = t.memberExpression(
          t.identifier('arguments'),
          t.numericLiteral(0),
          true
        );

        const bweMeta = t.objectExpression([
          t.objectProperty(
            t.identifier('parentMeta'),
            t.logicalExpression(
              '&&',
              propsAccessor,
              t.memberExpression(propsAccessor, t.identifier('__bweMeta'))
            )
          ),
        ]);

        const propsExpressions = props.properties.reduce(
          (expressions, { key, value }: any) => {
            expressions[key.name] = value;
            return expressions;
          },
          {} as any
        ) as {
          id?: string;
          props?: ObjectExpression;
          src?: StringLiteral | Identifier;
          trust?: ObjectExpression;
        };

        if (componentReferences[Component.name]) {
          const src = deriveComponentPath(
            componentPath,
            componentReferences[Component.name]
          );

          const trustValue = propsExpressions.trust
            ?.properties[0] as ObjectProperty;
          const trustMode =
            (trustValue?.value as StringLiteral)?.value || 'sandboxed';
          const isTrusted = isChildComponentTrusted(
            {
              trustMode,
              path: src,
            },
            isComponentPathTrusted
          );

          children.push({
            isTrusted,
            path: src,
            trustMode,
          });

          // replace imported reference depending on the render mode
          // - sandboxed: dynamic <Component /> to be initialized when the current container's Component tree is rendered
          // - trusted: static Component references, derived from Component path, rendered within the current container's Component tree
          Component.name = isTrusted
            ? buildComponentFunctionName(src)
            : 'Component';

          // use the derived Component path to set the "src" prop on <Component />
          if (!isTrusted) {
            props.properties.push(
              t.objectProperty(t.identifier('src'), t.stringLiteral(src))
            );
          } else {
            const componentProps = propsExpressions.props;
            props.properties = [
              t.objectProperty(
                t.identifier('__bweMeta'),
                t.objectExpression([
                  ...bweMeta.properties,
                  ...props!.properties.filter(
                    ({ value }: any) => value !== componentProps
                  ),
                ])
              ),
              ...(componentProps ? componentProps.properties : []),
            ];
          }
        }
      },
      ExportDeclaration(path: {
        node: ExportDefaultDeclaration | ExportNamedDeclaration;
        remove(): void;
        replaceWith(
          declaration: FunctionDeclaration | VariableDeclaration
        ): void;
        replaceWithMultiple(expressions: Expression[]): void;
      }) {
        if (t.isExportDefaultDeclaration(path.node)) {
          let component: Identifier | undefined;
          const declaration = (path.node as ExportDefaultDeclaration)
            .declaration as TSAsExpression | FunctionDeclaration | Identifier;

          if (t.isTSAsExpression(declaration)) {
            // export default X;
            component = (declaration as TSAsExpression)
              .expression as Identifier;

            path.remove();
          } else if (t.isFunctionDeclaration(declaration)) {
            // export default function X()
            component = (declaration as FunctionDeclaration).id as Identifier;
            if (!component) {
              // export default function ()
              component = t.identifier('BWEPlaceholderComponent');
              (declaration as FunctionDeclaration).id = component as Identifier;
            }

            path.replaceWith(declaration as FunctionDeclaration);
          } else if (t.isIdentifier(declaration)) {
            component = declaration as Identifier;
            path.remove();
          } else {
            console.error(`unsupported declaration type ${declaration?.type}`);
          }

          exports.default = component!.name;
        } else if (t.isExportNamedDeclaration(path.node)) {
          const { declaration } = path.node as ExportNamedDeclaration;
          if (t.isVariableDeclaration(declaration)) {
            const [exported] = (declaration as VariableDeclaration)
              .declarations;
            exports.named.push((exported.id as Identifier).name);

            path.replaceWith(declaration as VariableDeclaration);
          } else {
            console.error(`unsupported export type ${path.node.type}`);
          }
        }
      },
      ImportDeclaration(path: { node: ImportDeclaration; remove(): void }) {
        const {
          node: { source, specifiers },
        } = path;

        const importExpressions = specifiers.map((specifier) => {
          if (t.isImportSpecifier(specifier)) {
            // TODO differentiate/handle namespaced & side-effect imports
            const { imported, local } = specifier as ImportSpecifier;
            return {
              alias: local.name,
              isDestructured: true,
              reference: t.isIdentifier(imported)
                ? (imported as Identifier).name
                : (imported as StringLiteral).value,
            };
          } else if (t.isImportDefaultSpecifier(specifier)) {
            return {
              isDefault: true,
              reference: specifier.local.name,
            };
          }
        }) as ImportExpression[];

        const moduleImport = parseModuleImport(source.value, importExpressions);
        if (moduleImport.isBweModule) {
          const { reference } = moduleImport.imports.find(
            ({ isDefault }) => isDefault
          )!;
          componentReferences[reference!] = moduleImport;
        }

        imports.push(moduleImport);
        path.remove();
        return;
      },
    },
  });

  const { code } = Babel.transform(source, {
    presets: [Babel.availablePresets['typescript']],
    plugins: [
      [
        Babel.availablePlugins['transform-react-jsx'],
        { pragma: '__Preact.createElement' },
      ],
      transformComponents,
    ],
    filename: 'component.tsx', // name is not important, just the extension
  });

  return { children, code, exports, imports };
}
