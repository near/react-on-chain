import {
  Button,
  Dialog,
  NearIconSvg,
  Tooltip,
  useTheme,
} from '@bos-web-engine/ui';
import {
  Plus,
  Code,
  Eye,
  BracketsCurly,
  BookOpenText,
  GitPullRequest,
  ArrowLeft,
  FileX,
  Sun,
  Moon,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { useState } from 'react';

import { GitHubIconSvg } from './GitHubIconSvg';
import s from './SidebarActions.module.css';
import { useModifiedFiles } from '../hooks/useModifiedFiles';
import { useMonaco } from '../hooks/useMonaco';
import { useSandboxStore } from '../hooks/useSandboxStore';

type Props = {
  showFileOpener: () => void;
};

export function SidebarActions({ showFileOpener }: Props) {
  const monaco = useMonaco();
  const editors = monaco?.editor.getEditors();
  const containerElement = useSandboxStore((store) => store.containerElement);
  const mode = useSandboxStore((store) => store.mode);
  const addNewFile = useSandboxStore((store) => store.addNewFile);
  const setMode = useSandboxStore((store) => store.setMode);
  const expandedEditPanel = useSandboxStore((store) => store.expandedEditPanel);
  const resetAllFiles = useSandboxStore((store) => store.resetAllFiles);
  const setExpandedEditPanel = useSandboxStore(
    (store) => store.setExpandedEditPanel
  );
  const { modifiedFilePaths } = useModifiedFiles();
  const { theme, setTheme } = useTheme();

  const [localDeleteIsOpen, setLocalDeleteIsOpen] = useState(false);

  const formatCode = () => {
    const actionName = 'editor.action.formatDocument';

    editors?.forEach((editor) => {
      const action = editor?.getAction(actionName);

      if (!action) {
        console.warn(`Action not found ${actionName}`);
        return;
      }

      action.run();
    });
  };

  return (
    <>
      <div className={s.wrapper}>
        {mode === 'EDIT' && (
          <>
            <Tooltip
              content="Create a new component"
              side="right"
              container={containerElement}
            >
              <button
                className={s.action}
                type="button"
                onClick={() => addNewFile()}
              >
                <Plus />
              </button>
            </Tooltip>

            <Tooltip
              content="Open an existing component"
              side="right"
              container={containerElement}
            >
              <button
                className={s.action}
                type="button"
                onClick={showFileOpener}
              >
                <MagnifyingGlass />
              </button>
            </Tooltip>

            <Tooltip
              content="Format code"
              side="right"
              container={containerElement}
            >
              <button className={s.action} type="button" onClick={formatCode}>
                <BracketsCurly />
              </button>
            </Tooltip>

            <Tooltip
              content="Expand editor panel"
              side="right"
              container={containerElement}
            >
              <button
                className={s.action}
                type="button"
                onClick={() =>
                  setExpandedEditPanel(
                    expandedEditPanel === 'SOURCE' ? undefined : 'SOURCE'
                  )
                }
              >
                <Code />
              </button>
            </Tooltip>

            <Tooltip
              content="Expand preview panel"
              side="right"
              container={containerElement}
            >
              <button
                className={s.action}
                type="button"
                onClick={() =>
                  setExpandedEditPanel(
                    expandedEditPanel === 'PREVIEW' ? undefined : 'PREVIEW'
                  )
                }
              >
                <Eye />
              </button>
            </Tooltip>

            <Tooltip
              content={
                modifiedFilePaths.length > 0
                  ? `Review and publish changes: ${modifiedFilePaths.length}`
                  : 'No changes to publish'
              }
              side="right"
              container={containerElement}
            >
              <button
                className={s.action}
                type="button"
                onClick={() => setMode('PUBLISH')}
              >
                {modifiedFilePaths.length > 0 && (
                  <span className={s.actionBadge}>
                    {modifiedFilePaths.length}
                  </span>
                )}
                <GitPullRequest />
              </button>
            </Tooltip>
          </>
        )}

        {mode === 'PUBLISH' && (
          <>
            <Tooltip
              content="Back to editor"
              side="right"
              container={containerElement}
            >
              <button
                className={s.action}
                type="button"
                onClick={() => setMode('EDIT')}
              >
                <ArrowLeft />
              </button>
            </Tooltip>
          </>
        )}

        <Tooltip
          content="Documentation"
          side="right"
          container={containerElement}
        >
          <a
            className={s.action}
            style={{ marginTop: 'auto' }}
            href="https://bwe-docs.near.dev"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpenText />
          </a>
        </Tooltip>

        <Tooltip
          content="View this project on GitHub"
          side="right"
          container={containerElement}
        >
          <a
            className={s.action}
            href="https://github.com/near/bos-web-engine"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubIconSvg />
          </a>
        </Tooltip>

        <Tooltip
          content="Delete all local components and reinitialize examples"
          side="right"
          container={containerElement}
        >
          <button
            className={s.action}
            type="button"
            onClick={() => setLocalDeleteIsOpen(true)}
          >
            <FileX />
          </button>
        </Tooltip>

        <Dialog.Root
          open={localDeleteIsOpen}
          onOpenChange={setLocalDeleteIsOpen}
        >
          <Dialog.Portal container={containerElement}>
            <Dialog.Content anchor="center" size="m">
              <div className={s.localDeleteConfirmation}>
                <h2>Delete local components and reinitialize examples</h2>
                <p>
                  Any components in the editor which have not been published
                  will be lost. Would you like to proceed?
                </p>
                <Button
                  style={{ alignSelf: 'flex-end' }}
                  onClick={() => {
                    setLocalDeleteIsOpen(false);
                    resetAllFiles();
                  }}
                >
                  Yes
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {theme === 'dark' ? (
          <Tooltip
            content="Change to light theme"
            side="right"
            container={containerElement}
          >
            <button
              className={s.action}
              type="button"
              onClick={() => setTheme('light')}
            >
              <Moon />
            </button>
          </Tooltip>
        ) : (
          <Tooltip
            content="Change to dark theme"
            side="right"
            container={containerElement}
          >
            <button
              className={s.action}
              type="button"
              onClick={() => setTheme('dark')}
            >
              <Sun />
            </button>
          </Tooltip>
        )}

        <Tooltip
          content="Powered by NEAR"
          side="right"
          container={containerElement}
        >
          <a
            className={s.action}
            href="https://near.org"
            target="_blank"
            rel="noreferrer"
          >
            <NearIconSvg />
          </a>
        </Tooltip>
      </div>
    </>
  );
}
