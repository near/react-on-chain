import type { WebEngineLocalComponents } from '@bos-web-engine/application';
import { ComponentTree, useWebEngine } from '@bos-web-engine/application';
import {
  SandpackFileExplorer,
  SandpackLayout,
  useSandpack,
} from '@codesandbox/sandpack-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { MonacoEditor } from './MonacoEditor';
import { ACCOUNT_ID, PREACT_VERSION } from '../constants';
import { convertSandpackFilePathToComponentName } from '../utils';

const Preview = styled.div`
  flex: 1 1 0;
  color: #000;
  background: #fff;
`;

export function CustomSandpackLayout() {
  const { sandpack } = useSandpack();
  const { activeFile, files, visibleFiles } = sandpack;
  const [localComponents, setLocalComponents] =
    useState<WebEngineLocalComponents>();
  const [rootComponentPath, setRootComponentPath] = useState('');

  const { components, nonce } = useWebEngine({
    config: {
      preactVersion: PREACT_VERSION,
    },
    localComponents,
    rootComponentPath,
  });

  useEffect(() => {
    const componentName = convertSandpackFilePathToComponentName(activeFile);
    const componentPath = `${ACCOUNT_ID}/${componentName}`;
    setRootComponentPath(componentPath);
  }, [activeFile]);

  useEffect(() => {
    const editorComponents: WebEngineLocalComponents = [];

    visibleFiles.forEach((sandpackFilePath) => {
      const fileType = sandpackFilePath.split('.').pop() ?? '';

      if (!['jsx', 'tsx'].includes(fileType)) return;

      const sandpackFile = files[sandpackFilePath];
      const componentName =
        convertSandpackFilePathToComponentName(sandpackFilePath);
      const componentPath = `${ACCOUNT_ID}/${componentName}`;

      editorComponents.push({
        componentPath,
        componentSource: sandpackFile.code,
      });
    });

    setLocalComponents(editorComponents);
  }, [files, visibleFiles]);

  return (
    <SandpackLayout>
      <SandpackFileExplorer autoHiddenFiles />

      <MonacoEditor />

      <Preview>
        <ComponentTree
          key={nonce}
          components={components}
          rootComponentPath={rootComponentPath}
        />
      </Preview>
    </SandpackLayout>
  );
}
