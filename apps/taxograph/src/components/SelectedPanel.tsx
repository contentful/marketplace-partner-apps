import { useEffect, useState } from 'react';

import { useSDK } from '@contentful/react-apps-toolkit';

import { Tooltip } from '@contentful/f36-components';
import { CloseIcon, EmbeddedEntryInlineIcon, RichtextIcon, InfoCircleIcon, LinkAlternateIcon, TagsIcon, FolderOpenIcon, ErrorCircleOutlineIcon } from '@contentful/f36-icons';

import { getConcept, getConceptsMeta } from '../api/getConcepts';

import { linkTaxonomyConcept, linkTaxonomyConceptSchema, linkTaxonomyContent } from '../helpers';

import useStore from '../store/store';
import { getContentSchema } from '../api';


export function SelectedPanel() {
  const sdk = useSDK();

  const client = useStore((s) => s.client);
  const selectedNode = useStore((s) => s.selectedNode);
  const setSelectedNode = useStore((s) => s.setSelectedNode);

  const [isScheme, setIsScheme] = useState<boolean>(false);
  const [conceptData, setConceptData] = useState<any>(null);
  const [relatedData, setRelatedData] = useState<any[]>([]);

  useEffect(() => {
    if (selectedNode && client) {
      if (selectedNode.data.isRoot) {
        setIsScheme(true);

        getContentSchema(client, selectedNode.id).then(schema => {
          setConceptData(schema || null);
        })
      } else {
        setIsScheme(false);

        getConcept(client, selectedNode.id).then((concept) => {
          setConceptData(concept || null);
        });
      }
    }
  }, [selectedNode, client])

  useEffect(() => {
    if (conceptData && client) {
      const relatedIds = conceptData.related?.map((related: any) => related.sys.id);

      if (relatedIds?.length > 0) {
        getConceptsMeta(client, relatedIds).then((concepts) => {
          setRelatedData(
            concepts
          );
        });
      } else {
        setRelatedData([]);
      }
    }
  }, [conceptData, client])

  return (
    <div className='flex flex-col ml-auto px-5 py-4 bg-white drop-shadow-sm min-w-[400px] max-w-[400px] border-l border-solid border-gray-200 h-full'>
      <div className='border-b border-solid border-gray-200 pt-1 pb-3 mb-5 text-xl font-bold flex items-center'>
        {selectedNode?.data.label as string}

        {selectedNode?.data.isRoot as boolean &&
          <div className='ml-3 gap-3 flex items-center'>
            <Tooltip placement='bottom' id='schemaLink' content='Open schema in manager'>
              <a href={linkTaxonomyConceptSchema(sdk.ids.organization, selectedNode?.id)} target='_blank'>
                <EmbeddedEntryInlineIcon variant='secondary' />
              </a>
            </Tooltip>
          </div>
        }

        {!selectedNode?.data.isRoot &&
          <div className='ml-3 gap-3 flex items-center'>
            <Tooltip placement='bottom' id='conceptLink' content='Open concept in manager'>
              <a href={linkTaxonomyConcept(sdk.ids.organization, selectedNode?.id)} target='_blank'>
                <EmbeddedEntryInlineIcon variant='secondary' />
              </a>
            </Tooltip>
            <Tooltip placement='bottom' id='contentLink' content='Open assigned content'>
              <a href={linkTaxonomyContent(sdk.ids.space, sdk.ids.environment, selectedNode?.id)} target='_blank'>
                <RichtextIcon variant='secondary' />
              </a>
            </Tooltip>
          </div>
        }

        <div className='ml-auto'>
          <Tooltip placement='bottom' id='closeItem' content='Close'>
            <a onClick={() => setSelectedNode(null)} className='p-2 cursor-pointer'>
              <CloseIcon variant='muted' />
            </a>
          </Tooltip>
        </div>
      </div>
      {
        conceptData && (
          <div>
            <div className='text-gray-600 text-sm mb-2 flex items-center gap-1'>
              <ErrorCircleOutlineIcon variant='muted' className='rotate-180' />
              Definition
            </div>
            <div className='text-sm mb-5'>
              {conceptData.definition && conceptData.definition['en-US']}
              {!conceptData.definition && <i className='text-gray-600'>No definition available</i>}
            </div>
            <div className='text-gray-600 text-sm mb-2 flex items-center gap-1'>
              <LinkAlternateIcon variant='muted' />
              URI
            </div>
            <div className='text-sm mb-5 truncate'>
              {conceptData?.uri &&
                <a href={conceptData.uri} target='_blank' className='text-sky-600 hover:underline'>
                  {conceptData.uri}
                </a>
              }
              {!conceptData?.uri &&
                <i className='text-gray-600'>No uri available</i>
              }
            </div>
            {!isScheme &&
              <>
                <div className='text-gray-600 text-sm mb-2 flex items-center gap-1'>
                  <TagsIcon variant='muted' />
                  Labels
                </div>
                {conceptData.hiddenLabels && (conceptData.hiddenLabels['en-US'].length > 0 || conceptData.altLabels['en-US'].length) > 0 &&
                  <div className='text-sm mb-5'>
                    {conceptData.hiddenLabels && conceptData.hiddenLabels['en-US'].length > 0 && (conceptData.hiddenLabels['en-US'].join(', '))}
                    {conceptData.altLabels && conceptData.altLabels['en-US'].length > 0 && (conceptData.altLabels['en-US'].join(', '))}
                  </div>
                }
                {(!conceptData.hiddenLabels && !conceptData.altLabels) || (conceptData.hiddenLabels['en-US'].length === 0 && conceptData.altLabels['en-US'].length === 0) &&
                  <div className='text-sm mb-5'>
                    <i className='text-gray-600'>No labels available</i>
                  </div>
                }

                <div className='text-gray-600 text-sm mb-2 flex items-center gap-1'>
                  <FolderOpenIcon variant='muted' />
                  Related
                </div>

                {relatedData.length > 0 &&
                  <div className='text-sm mb-5'>
                    <div className='items-center gap-2 flex flex-wrap'>
                      {relatedData.map((related: any) => (
                        <div className='flex bg-sky-100 rounded-md' key={related.id}>
                          <Tooltip placement='bottom' id={related.id} content='Open concept in manager'>
                            <a className='p-2 px-4 flex' href={linkTaxonomyConcept(sdk.ids.organization, related.id)} target='_blank'>{related.label}</a>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </div>
                }
                {!relatedData || relatedData.length === 0 &&
                  <div className='text-sm mb-5'>
                    <i className='text-gray-600'>No items available</i>
                  </div>
                }
              </>
            }

            {conceptData.note || conceptData.scopeNote || conceptData.editorialNote || conceptData.historyNote &&
              <>
                <div className='text-gray-600 text-sm mb-2 flex items-center gap-1'>
                  <InfoCircleIcon variant='muted' />
                  Notes
                </div>
                <div className='text-sm mb-5'>
                  {conceptData.note && conceptData.note}
                  {conceptData.scopeNote && conceptData.scopeNote}
                  {conceptData.editorialNote && conceptData.editorialNote}
                  {conceptData.historyNote && conceptData.historyNote}
                </div>
              </>
            }
          </div>
        )
      }
      {!conceptData &&
        <div className='m-auto'>
          <div className='rounded-full bg-gray-100'>
            Loading..
          </div>
        </div>
      }
    </div >
  )
}