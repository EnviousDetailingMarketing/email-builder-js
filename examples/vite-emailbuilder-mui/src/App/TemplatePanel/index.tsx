import React, { useMemo } from 'react';

import { DarkModeOutlined, LightModeOutlined, MonitorOutlined, PhoneIphoneOutlined } from '@mui/icons-material';
import { Box, Stack, SxProps, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Reader, renderToStaticMarkup } from '@usewaypoint/email-builder';

import EditorBlock from '../../documents/editor/EditorBlock';
import {
  setSelectedColorScheme,
  setSelectedScreenSize,
  useDocument,
  useSelectedColorScheme,
  useSelectedMainTab,
  useSelectedScreenSize,
} from '../../documents/editor/EditorContext';
import ToggleInspectorPanelButton from '../InspectorDrawer/ToggleInspectorPanelButton';
import ToggleSamplesPanelButton from '../SamplesDrawer/ToggleSamplesPanelButton';

import CanvasErrorBoundary from './CanvasErrorBoundary';
import DownloadJson from './DownloadJson';
import HtmlPanel from './HtmlPanel';
import ImportJson from './ImportJson';
import JsonPanel from './JsonPanel';
import MainTabsGroup from './MainTabsGroup';
import ShareButton from './ShareButton';
import UndoRedoButtons from './UndoRedoButtons';

export default function TemplatePanel() {
  const document = useDocument();
  const selectedMainTab = useSelectedMainTab();
  const selectedScreenSize = useSelectedScreenSize();
  const selectedColorScheme = useSelectedColorScheme();

  // WS-04 dark preview: render the real export HTML and un-guard the dark media
  // query so the (auto-derived) dark CSS we emit applies regardless of the host
  // system's color-scheme setting, then show it in an isolated iframe. This is
  // the most faithful preview of the rendered output. Limitations: it force-
  // applies the @media block (real clients trigger it via the user's system
  // setting), and the [data-ogsc]/[data-ogsb] Outlook.com hooks are inert here
  // (they only activate inside Outlook's dark renderer).
  const darkPreviewHtml = useMemo(() => {
    if (selectedColorScheme !== 'dark') {
      return null;
    }
    const html = renderToStaticMarkup(document, { rootBlockId: 'root' });
    return html.split('@media (prefers-color-scheme: dark)').join('@media all');
  }, [document, selectedColorScheme]);

  let mainBoxSx: SxProps = {
    height: '100%',
  };
  if (selectedScreenSize === 'mobile') {
    mainBoxSx = {
      ...mainBoxSx,
      margin: '32px auto',
      width: 370,
      height: 800,
      boxShadow:
        'rgba(33, 36, 67, 0.04) 0px 10px 20px, rgba(33, 36, 67, 0.04) 0px 2px 6px, rgba(33, 36, 67, 0.04) 0px 0px 1px',
    };
  }

  const handleScreenSizeChange = (_: unknown, value: unknown) => {
    switch (value) {
      case 'mobile':
      case 'desktop':
        setSelectedScreenSize(value);
        return;
      default:
        setSelectedScreenSize('desktop');
    }
  };

  const handleColorSchemeChange = (_: unknown, value: unknown) => {
    setSelectedColorScheme(value === 'dark' ? 'dark' : 'light');
  };

  const renderMainPanel = () => {
    switch (selectedMainTab) {
      case 'editor':
        return (
          <Box sx={mainBoxSx}>
            <EditorBlock id="root" />
          </Box>
        );
      case 'preview':
        if (darkPreviewHtml !== null) {
          return (
            <Box sx={mainBoxSx}>
              <iframe
                title="Dark mode preview"
                srcDoc={darkPreviewHtml}
                style={{ width: '100%', height: '100%', minHeight: 400, border: 'none' }}
              />
            </Box>
          );
        }
        return (
          <Box sx={mainBoxSx}>
            <Reader document={document} rootBlockId="root" />
          </Box>
        );
      case 'html':
        return <HtmlPanel />;
      case 'json':
        return <JsonPanel />;
    }
  };

  return (
    <>
      <Stack
        sx={{
          height: 49,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 'appBar',
          px: 1,
        }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <ToggleSamplesPanelButton />
        <Stack px={2} direction="row" gap={2} width="100%" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <MainTabsGroup />
            <UndoRedoButtons />
          </Stack>
          <Stack direction="row" spacing={2}>
            <DownloadJson />
            <ImportJson />
            <ToggleButtonGroup value={selectedScreenSize} exclusive size="small" onChange={handleScreenSizeChange}>
              <ToggleButton value="desktop">
                <Tooltip title="Desktop view">
                  <MonitorOutlined fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="mobile">
                <Tooltip title="Mobile view">
                  <PhoneIphoneOutlined fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup value={selectedColorScheme} exclusive size="small" onChange={handleColorSchemeChange}>
              <ToggleButton value="light">
                <Tooltip title="Light mode">
                  <LightModeOutlined fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="dark">
                <Tooltip title="Dark mode (preview tab)">
                  <DarkModeOutlined fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            <ShareButton />
          </Stack>
        </Stack>
        <ToggleInspectorPanelButton />
      </Stack>
      <Box sx={{ height: 'calc(100vh - 49px)', overflow: 'auto', minWidth: 370 }}>
        {/* Keyed by tab so an errored canvas doesn't block switching to JSON to fix it. */}
        <CanvasErrorBoundary key={selectedMainTab}>{renderMainPanel()}</CanvasErrorBoundary>
      </Box>
    </>
  );
}
