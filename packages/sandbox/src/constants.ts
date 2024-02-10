import { SandboxFile, SandboxFiles } from './hooks/useSandboxStore';
import { MonacoExternalLibrary } from './types';

export const FILE_EXTENSIONS = ['tsx', 'module.css'] as const;
export type FileExtension = (typeof FILE_EXTENSIONS)[number];

export const DEFAULT_SANDBOX_ACCOUNT_ID = 'bwe-web.near';
export const PREACT_VERSION = '10.17.1';
export const FILE_EXTENSION_REGEX = new RegExp(
  `\\.(${FILE_EXTENSIONS.join('|')})$`
);
export const PREVIEW_UPDATE_DEBOUNCE_DELAY = 750;

export const MONACO_EXTERNAL_LIBRARIES: MonacoExternalLibrary[] = [
  {
    // Include the DOM types manually due to TS Config `lib: ["dom"]` not working in Monaco:
    resolutionPath: 'file:///dom.d.ts',
    url: 'https://www.unpkg.com/typescript@5.3.3/lib/lib.dom.d.ts',
  },
  {
    // Include the ES types manually due to TS Config `lib: ["ESNext"]` not working in Monaco:
    resolutionPath: 'file:///es.d.ts',
    url: 'https://www.unpkg.com/typescript@5.3.3/lib/lib.esnext.d.ts',
  },
  {
    resolutionPath: 'file:///node_modules/@types/react/index.d.ts',
    url: 'https://unpkg.com/@types/react@18.2.47/index.d.ts',
  },
  {
    resolutionPath: 'file:///node_modules/@types/react-dom/index.d.ts',
    url: 'https://unpkg.com/@types/react-dom@18.2.18/index.d.ts',
  },
  {
    resolutionPath: 'file:///node_modules/@types/react/jsx-runtime.d.ts',
    url: 'https://unpkg.com/@types/react@18.2.47/jsx-runtime.d.ts',
  },
  {
    resolutionPath: 'file:///globals.d.ts',
    source: `import { JSX } from 'react';
    
    declare global {
      declare module '*.module.css' {
        const classes: { [key: string]: string };
        export default classes;
      }

      type BWEComponent<TProps = {}> = (props: {
        id?: string;
        props?: TProps;
        trust?: { mode: string };
      }) => JSX.Element;

      function Component(props: {
        src: string;
        props?: Record<any, any>;
        trust?: { mode: string };
        id?: string;
      }): JSX.Element;
    }`,
  },
];

export const DEFAULT_FILES: SandboxFiles = {
  'HelloWorld.tsx': {
    css: `.wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}    
  `,
    source: `/*
  Welcome to the BOS Web Engine Sandbox!

  This environment has TypeScript support. All changes in this IDE 
  are automatically persisted in local storage. Feel free to add, 
  remove, and rename files.
  
  The following code example demonstrates multi file component editing 
  capabilities. Try opening up Message.tsx from the file explorer, 
  make a visible code change, and then come back to HelloWorld.tsx
  to see your changes reflected in the imported component.
*/

import { useState } from 'react';
import Message from './Message';
import s from './styles.module.css';

function HelloWorld() {
  const [count, setCount] = useState(0);

  return (
    <div className={s.wrapper}>
      <h1>Welcome!</h1>

      <Message props={{ message: 'Hello world!' }} />

      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Increase Count: {count}
      </button>
    </div>
  );
}

export default HelloWorld as BWEComponent;
`,
  },
  'Message.tsx': {
    css: `.wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--green-4);
  color: var(green-1);
  border-radius: 0.5rem;
}

.title {
  color: var(--green-10);
}

.message {
  color: var(--green-10);
}
`,
    source: `import s from './styles.module.css';

type Props = {
  message?: string;
};

function Message({ message = 'Default message...' }: Props) {
  return (
    <div className={s.wrapper}>
      <h2 className={s.title}>BOS Says:</h2>
      <p className={s.message}>{message}</p>
    </div>
  );
}

export default Message as BWEComponent<Props>;
`,
  },
};

export const NEW_COMPONENT_TEMPLATE: SandboxFile = {
  css: `.wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: red;
}
`,
  source: `import s from './styles.module.css';

type Props = {
  message?: string;
};

function MyComponent({ message = "Hello!" }: Props) {
  return (
    <div className={s.wrapper}>
      <p>{message}</p>
    </div>
  );
}

export default MyComponent as BWEComponent<Props>;
`,
};
