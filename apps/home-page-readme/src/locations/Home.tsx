import React, { useState, useEffect } from 'react';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { checkForReadmeEntries } from '../utils/contentful';
import { Flex, Stack, Tooltip, Select, Text, IconButton, Spinner } from '@contentful/f36-components';
import { EditIcon, CycleIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import './style.css';
import './markdown-styles.modules.css';

// Define types for better type safety
type ReadMeEntry = {
  id: string;
  title: string;
  markdown: string;
};

const emptyReadMe: ReadMeEntry = { id: '', title: '', markdown: '#No Readme Found' };

export const Home = () => {
  const cma = useCMA();
  const sdk = useSDK();

  const [readmeEntries, setReadMeEntries] = useState<ReadMeEntry[]>([]);
  const [readMe, setReadMe] = useState<ReadMeEntry>(emptyReadMe);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReadmeList = async (readMeId?: string) => {
    try {
      setIsLoading(true);
      const items = await checkForReadmeEntries(cma);

      if (!items || items.length === 0) {
        setReadMe(emptyReadMe);
        sdk.notifier.error('No Readme Entries Found, please create one or more.');
        return;
      }

      const simpleReadMeList: ReadMeEntry[] = items.map(
        (item: {
          sys: { id: string };
          fields: {
            title: { 'en-US': string };
            readMe: { 'en-US': string };
          };
        }) => {
          const {
            sys: { id },
            fields: {
              title: { 'en-US': title },
              readMe: { 'en-US': markdown },
            },
          } = item;
          return { id, title, markdown };
        }
      );

      const selectedEntry = readMeId ? simpleReadMeList.find((item) => item.id === readMeId) : simpleReadMeList[0];

      setReadMeEntries(simpleReadMeList);
      setReadMe(selectedEntry || emptyReadMe);
    } catch (error: any) {
      sdk.notifier.error('Failed to load README entries: ' + error.message);
      console.error('Error loading README entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    if (readMe.id) {
      sdk.navigator.openEntry(readMe.id, { slideIn: { waitForClose: true } });
    }
  };

  const handleRefreshClick = async () => {
    await fetchReadmeList();
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    fetchReadmeList(e.target.value);
  };

  useEffect(() => {
    fetchReadmeList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex flexDirection="column" alignItems="center" fullWidth fullHeight>
      <Stack justifyContent="center" padding="spacing2Xs" fullWidth style={{ backgroundColor: tokens.gray700 }}>
        <Flex flexDirection="column" gap="spacingXl" style={{ width: '900px' }}>
          <Flex flexDirection="row" alignItems="center" gap="spacingXs" justifyContent="left">
            <Text fontColor="gray100" fontSize="fontSizeL">
              Select Readme
            </Text>
            <Select id="optionSelect-controlled" name="optionSelect-controlled" value={readMe.id} onChange={handleSelectChange} isDisabled={isLoading}>
              {readmeEntries.map((entry) => (
                <Select.Option key={entry.id} value={entry.id}>
                  {entry.title}
                </Select.Option>
              ))}
            </Select>
            <Tooltip content="Refresh All">
              <IconButton variant="primary" onClick={handleRefreshClick} isDisabled={isLoading} icon={<CycleIcon />} aria-label="Refresh README list" />
            </Tooltip>
            <Tooltip content="Edit this ReadMe">
              <IconButton variant="primary" onClick={handleEditClick} isDisabled={isLoading || !readMe.id} icon={<EditIcon />} aria-label="Edit Readme" />
            </Tooltip>
          </Flex>
        </Flex>
      </Stack>
      <Flex style={{ width: '900px', flex: 1 }} flexDirection="column" marginTop="spacingS" padding="spacingXs" className="reactMarkDown">
        {isLoading ? (
          <Flex justifyContent="center" padding="spacingM">
            <Spinner size="large" />
            <Text marginLeft="spacingS">Loading README content...</Text>
          </Flex>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{readMe.markdown}</ReactMarkdown>
        )}
      </Flex>
    </Flex>
  );
};

export default Home;
