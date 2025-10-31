'use client';

import React, { useState } from 'react';
import { Paragraph, Button, Card, Stack, Text, Heading, Note, List, ListItem } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useErrorState } from '../hooks/useErrorState';

const PageComponent = () => {
  const sdk = useSDK();
  const { handleError } = useErrorState('Page');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const navigateToConfig = () => {
    sdk.navigator.openAppConfig();
  };

  const copyToClipboard = async (text: string, snippetId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSnippet(snippetId);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <ErrorBoundary componentName="Page" onError={handleError}>
      <div style={{ margin: '0 auto', maxWidth: '1400px', padding: '0 24px' }}>
        <Stack flexDirection="column" spacing="spacingXl" alignItems="flex-start" style={{ width: '100%' }}>
          <div>
            <Heading as="h1" marginBottom="spacingS">
              Welcome to LaunchDarkly + Contentful!
            </Heading>
            <Text>This app helps you create LaunchDarkly feature flags and map your Contentful content to flag variations.</Text>
            <Text>Experiment with personalized content delivery and A/B testing!</Text>    
          </div>

        <Card padding="default">
          <Stack flexDirection="column" spacing="spacingM" alignItems="flex-start">
            <div>
              <Heading as="h2" marginBottom="spacingS">
                Quick Start Guide
              </Heading>
              <Text>Follow these steps to start using feature flags with your content:</Text>
            </div>

            <Note variant="primary">
              <Text fontWeight="fontWeightMedium">Security Note:</Text> Keep in mind that this app only allows you to create new flags in LaunchDarkly, not modify existing ones. This keeps your production flags safe!
            </Note>

            <div style={{ marginTop: '16px' }}>
              <Text fontWeight="fontWeightMedium" marginBottom="spacingXs">Step 1: Set up your LaunchDarkly Connection</Text>
              <Paragraph marginBottom="spacingS">
                Set up your LaunchDarkly API key, select your project, and choose your environment.
              </Paragraph>
              <Button variant="primary" onClick={navigateToConfig}>
                Open Configuration
              </Button>
            </div>

            {/* Step 2 intentionally omitted here. Workflows are covered later when using the Entry Editor. */}

            <div style={{ marginTop: '16px' }}>
              <Text fontWeight="fontWeightMedium" marginBottom="spacingXs">Step 2: Ensure the Contentful Content Model is setup</Text>
              <Paragraph marginBottom="spacingS">
                On the Configuration screen, you'll also see a button which will trigger the automatic creation of the LaunchDarkly Feature Flag content type.
                Once created, you can use the content type to create and map LaunchDarkly feature flags.
              </Paragraph>

              <Card padding="default" style={{ width: '55%', backgroundColor: '#f7f9fc', borderLeft: '4px solid #d0e2ff', marginTop: '30px', marginBottom: '30px', paddingBottom: '24px', paddingTop: '24px' }}>
                <Stack flexDirection="row" spacing="spacingL" alignItems="flex-start" style={{ width: '100%' }}>
                  <div style={{ width: '100%', minWidth: '280px' }}>
                    <img
                      src="/contentful/content-creation.png"
                      alt="Create LaunchDarkly Feature Flag content type"
                      loading="lazy"
                      style={{ maxWidth: '90%', height: 'auto', border: '1px solid #e5e7eb', borderRadius: 4, margin: 'auto' }}
                    />
                  </div>
                </Stack>
              </Card>

              {/* <Card padding="default" style={{ width: '100%', backgroundColor: '#f7f9fc', borderLeft: '4px solid #d0e2ff', marginTop: '30px' }}>
                <Stack flexDirection="row" spacing="spacingL" alignItems="flex-start" style={{ width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <Text fontWeight="fontWeightMedium">Create the "LaunchDarkly Feature Flag" content type</Text>
                    <Paragraph marginTop="spacingXs">
                      Create a content type for creating and mapping LaunchDarkly feature flags. This will be used to store the flag data.
                    </Paragraph>
                    <List>
                      <ListItem>Go to the <strong>Content Model</strong> section in your Contentful space</ListItem>
                      <ListItem>Search for "LaunchDarkly Feature Flag" or create a new content type if it is not already present and name it "LaunchDarkly Feature Flag"</ListItem>
                      <ListItem>
                        Ensure the following fields are present:
                        <List>
                          <ListItem>Name (Short Text)</ListItem>
                          <ListItem>Key (Short Text)</ListItem>
                          <ListItem>Description (Long Text)</ListItem>
                          <ListItem>Variations (JSON Object)</ListItem>
                          <ListItem>Content Mapping (References, many)</ListItem>
                        </List>
                      </ListItem>
                      <ListItem>Save changes if necessary</ListItem>
                    </List>
                  </div>
                  <div style={{ width: '50%', minWidth: '280px' }}>
                    <Card padding="none" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', height: '100%', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src="/contentful/content-model-type.png"
                        alt="Create LaunchDarkly Feature Flag content type"
                        loading="lazy"
                        style={{ maxWidth: '100%', height: 'auto', border: '1px solid #e5e7eb', borderRadius: 4 }}
                      />
                    </Card>
                  </div>
                </Stack>
              </Card> */}

              {/* <Text fontWeight="fontWeightMedium" marginBottom="spacingXs">Step 3: LaunchDarklyEntry Editor</Text>
              <Paragraph marginBottom="spacingS">
                Now that the LaunchDarkly Feature Flag content type is created, you'll want to add the LaunchDarkly app as an Entry Editor.
              </Paragraph> */}
              {/* <Card padding="default" style={{ width: '100%', backgroundColor: '#f7f9fc', borderLeft: '4px solid #d0e2ff', marginTop: '30px' }}>
                <Stack flexDirection="row" spacing="spacingL" alignItems="flex-start" style={{ width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <Text fontWeight="fontWeightMedium">Add the LaunchDarkly app as Entry Editor</Text>
                    <Paragraph marginTop="spacingXs">
                      You'll want to do this in the <strong>LaunchDarkly Feature Flag</strong> content type that you created in the previous step.
                    </Paragraph>
                    <List>
                      <ListItem>Go to <strong>Content Model</strong> in your Contentful space</ListItem>
                      <ListItem>Select the <strong>LaunchDarkly Feature Flag</strong> content type</ListItem>
                      <ListItem>Click <strong>Entry editors</strong> in the sidebar</ListItem>
                      <ListItem>Click the plus icon in the "Available items" column for the LaunchDarkly app</ListItem>
                      <ListItem>Save your changes</ListItem>
                    </List>
                  </div>
                  <div style={{ width: '50%', minWidth: '280px' }}>
                    <Card padding="none" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', height: '100%', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                        src="/contentful/entry-editor.png"
                        alt="Create LaunchDarkly Feature Flag content type"
                        loading="lazy"
                        style={{ maxWidth: '100%', height: 'auto', border: '1px solid #e5e7eb', borderRadius: 4 }}
                      />
                    </Card>
                  </div>
                </Stack>
              </Card> */}
              <Text fontWeight="fontWeightMedium" marginBottom="spacingXs">Step 3 (Optional): Setup the Sidebar Location</Text>
              <Paragraph marginTop="spacingXs">
                When running Experiments through LaunchDarkly via this app, it can be useful to know which Contentfulentries are associated with which flag variations.
                LaunchDarkly can't restrict changes to variant entries within Contentful. Since changes to entries will effect Experiment Results, it's useful to add the Sidebar location to Contentful entrieswhere we can see a warning for  flag associations within them.
              </Paragraph>
              <Card padding="default" style={{ width: '100%', backgroundColor: '#f7f9fc', borderLeft: '4px solid #d0e2ff', marginTop: '30px' }}>
                <Stack flexDirection="row" spacing="spacingL" alignItems="flex-start" style={{ width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <Text fontWeight="fontWeightMedium">Add Sidebar Location</Text>
                    <List>
                      <ListItem>To set up, go to the Content Model for entries you would use with LaunchDarkly flag variations</ListItem>
                      <ListItem>Select the <strong>Sidebar</strong> location the left hand navigation</ListItem>
                      <ListItem>Add the <strong>LaunchDarkly</strong> app in "Available items" to the Sidebar area</ListItem>
                      <ListItem>This will show flag status and details in the entry sidebar for entries that are associated with flag variations</ListItem>
                      <ListItem>Remember to save your changes!</ListItem>
                    </List>
                  </div>
                  <div style={{ width: '50%', minWidth: '280px' }}>
                    <Card padding="none" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', height: '100%', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src="/contentful/sidebar-model.png"
                        alt="Create LaunchDarkly Feature Flag content type"
                        loading="lazy"
                        style={{ maxWidth: '100%', height: 'auto', border: '1px solid #e5e7eb', borderRadius: 4 }}
                      />
                    </Card>
                  </div>
                </Stack>
              </Card>

              <Note variant="primary" style={{ marginTop: '30px' }}>
                <Text fontWeight="fontWeightMedium">Pro Tip:</Text>
                <Paragraph marginTop="spacingXs">
                  You can use the dedicated content type alone for LaunchDarkly flag mapping, or add the content type as a Reference field to existing content types where you want to use feature flags for things like Experiments.
                </Paragraph>
              </Note>
            </div>

            {/* <div style={{ marginTop: '16px' }}>
              <Text fontWeight="fontWeightMedium" marginBottom="spacingXs">Step 3: Create Your First LaunchDarkly Feature Flag Entry</Text>
              <Paragraph marginTop="spacingXs">
                Now that your content model is set up, you can create LaunchDarkly feature flag entries and map them to your content.
              </Paragraph>

              <div style={{ marginTop: '24px' }}>
                <Text fontWeight="fontWeightMedium" marginBottom="spacingXs">Step 3a: Create a Feature Flag in the Entry Editor</Text>
                <Paragraph marginTop="spacingXs">
                  Create a new entry using the LaunchDarkly Feature Flag content type to define your flag and its variations.
                </Paragraph>
                <Card padding="default" style={{ width: '100%', backgroundColor: '#f7f9fc', borderLeft: '4px solid #d0e2ff', marginTop: '30px' }}>
                  <Stack flexDirection="row" spacing="spacingL" alignItems="flex-start" style={{ width: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <Text fontWeight="fontWeightMedium">Create a LaunchDarkly Feature Flag Entry</Text>
                      <Paragraph marginTop="spacingXs">
                        Use the Entry Editor to create and configure your feature flags directly in Contentful.
                      </Paragraph>
                      <List>
                        <ListItem>Go to <strong>Content</strong> in your Contentful space</ListItem>
                        <ListItem>Click <strong>Add entry</strong> and select <strong>LaunchDarkly Feature Flag</strong></ListItem>
                        <ListItem>The Entry Editor will open with the LaunchDarkly app interface</ListItem>
                        <ListItem>Enter a flag name and key (the key must be unique in your LaunchDarkly project)</ListItem>
                        <ListItem>Add a description to help your team understand the flag's purpose</ListItem>
                        <ListItem>Define your flag variations (e.g., true/false for boolean flags, or custom values)</ListItem>
                      </List>
                    </div>
                    <div style={{ width: '50%', minWidth: '280px' }}>
                      <Card padding="none" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', height: '100%', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src="/contentful/entry-editor.png"
                          alt="LaunchDarkly Entry Editor"
                          loading="lazy"
                          style={{ maxWidth: '100%', height: 'auto', border: '1px solid #e5e7eb', borderRadius: 4 }}
                        />
                      </Card>
                    </div>
                  </Stack>
                </Card>
              </div>

              <div style={{ marginTop: '24px' }}>
                <Text fontWeight="fontWeightMedium" marginBottom="spacingXs">Step 3b: Map Variations to Content</Text>
                <Paragraph marginTop="spacingXs">
                  After creating your flag, map each variation to specific Contentful entries to control what content gets served.
                </Paragraph>
                <Card padding="default" style={{ width: '100%', backgroundColor: '#f7f9fc', borderLeft: '4px solid #d0e2ff', marginTop: '30px' }}>
                  <Stack flexDirection="row" spacing="spacingL" alignItems="flex-start" style={{ width: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <Text fontWeight="fontWeightMedium">Map Content to Flag Variations</Text>
                      <Paragraph marginTop="spacingXs">
                        Link your Contentful entries to each flag variation to create dynamic, personalized experiences.
                      </Paragraph>
                      <List>
                        <ListItem>In the Entry Editor, scroll to the <strong>Content Mapping</strong> section</ListItem>
                        <ListItem>For each variation, select a Contentful entry to associate with that variation</ListItem>
                        <ListItem>The order of mapped content corresponds to the order of variations</ListItem>
                        <ListItem>For example: Variation 0 (false) → Entry A, Variation 1 (true) → Entry B</ListItem>
                        <ListItem>Click <strong>Create Flag</strong> to publish the flag to LaunchDarkly</ListItem>
                        <ListItem>Save the entry in Contentful to preserve your mappings</ListItem>
                      </List>
                      <Note variant="primary" style={{ marginTop: '12px' }}>
                        <Text fontWeight="fontWeightMedium">Note:</Text>
                        <Paragraph marginTop="spacingXs" style={{ marginTop: '4px' }}>
                          The app will create the flag in LaunchDarkly with the variations you defined. The content mapping is stored only in Contentful and used by your application to serve the correct content based on flag evaluation.
                        </Paragraph>
                      </Note>
                    </div>
                    <div style={{ width: '50%', minWidth: '280px' }}>
                      <Card padding="none" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', height: '100%', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src="/contentful/content-model-type.png"
                          alt="Map variations to content"
                          loading="lazy"
                          style={{ maxWidth: '100%', height: 'auto', border: '1px solid #e5e7eb', borderRadius: 4 }}
                        />
                      </Card>
                    </div>
                  </Stack>
                </Card>
              </div>
            </div> */}
          </Stack>
        </Card>

        <Card padding="default" style={{ width: '100%' }}>
          <Stack flexDirection="column" spacing="spacingM" alignItems="flex-start" style={{ width: '100%' }}>
            <Heading as="h3">Implementation Guide</Heading>
            <Text>
              Once you&#39;ve created flags and mapped content, here&#39;s how to implement this integration in your application:
            </Text>

            <div style={{ width: '100%' }}>
              <Text fontWeight="fontWeightMedium">1. Install LaunchDarkly SDK</Text>
              <Paragraph marginTop="spacingXs">
                First, install the LaunchDarkly SDK for your platform:
              </Paragraph>
              <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button) button.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button) button.style.opacity = '0';
              }}>
                <Card padding="large" style={{ backgroundColor: '#1a1a1a', color: '#e6e6e6', fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '13px', borderRadius: '6px', border: '1px solid #333', width: 'fit-content', minWidth: '300px', maxWidth: '100%', overflow: 'auto' }}>
                  <div dangerouslySetInnerHTML={{
                    __html: `
                      <code style="color: #e6e6e6; display: block; line-height: 1.5;">
                        <span style="color: #569cd6;">npm</span> 
                        <span style="color: #9cdcfe;">install</span> 
                        <span style="color: #ce9178;">@launchdarkly/js-client-sdk</span>
                      </code>
                    `
                  }} />
                </Card>
                <button
                  onClick={() => copyToClipboard('npm install @launchdarkly/js-client-sdk', 'npm-install')}
                  style={{ position: 'absolute', top: '6px', right: '6px', background: copiedSnippet === 'npm-install' ? '#4caf50' : '#333', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer', padding: '4px 6px', fontSize: '10px', opacity: '0', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {copiedSnippet === 'npm-install' ? '✓' : 
                    <span style={{ position: 'relative', display: 'inline-block', width: '8px', height: '8px' }}>
                      <span style={{ position: 'absolute', top: '0px', left: '0px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px' }}></span>
                      <span style={{ position: 'absolute', top: '2px', left: '2px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px', backgroundColor: '#333' }}></span>
                    </span>
                  }
                </button>
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <Text fontWeight="fontWeightMedium">2. Initialize LaunchDarkly Client</Text>
              <Paragraph marginTop="spacingXs">
                Set up the LaunchDarkly client in your application:
              </Paragraph>
              <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button) button.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button) button.style.opacity = '0';
              }}>
                <Card padding="large" style={{ backgroundColor: '#1a1a1a', color: '#e6e6e6', fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '13px', borderRadius: '6px', border: '1px solid #333', whiteSpace: 'pre-wrap', width: '700px', maxWidth: '100%', overflow: 'auto' }}>
                  <div dangerouslySetInnerHTML={{
                    __html: `<code style="color: #e6e6e6; display: block; line-height: 1.5; white-space: pre-line;"><span style="color: #c586c0;">import</span> <span style="color: #569cd6;">*</span> <span style="color: #c586c0;">as</span> <span style="color: #4ec9b0;">LD</span> <span style="color: #c586c0;">from</span> <span style="color: #ce9178;">'@launchdarkly/js-client-sdk'</span>;

                        <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">client</span> <span style="color: #d4d4d4;">=</span> <span style="color: #4ec9b0;">LD</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">initialize</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">'YOUR_CLIENT_SIDE_ID'</span><span style="color: #d4d4d4;">, {</span>
                        &nbsp;&nbsp;<span style="color: #9cdcfe;">key</span><span style="color: #d4d4d4;">:</span> <span style="color: #ce9178;">'user-key'</span><span style="color: #d4d4d4;">,</span>
                        &nbsp;&nbsp;<span style="color: #9cdcfe;">email</span><span style="color: #d4d4d4;">:</span> <span style="color: #ce9178;">'user@example.com'</span>
                        <span style="color: #d4d4d4;">});</span>
                      </code>
                    `
                  }} />
                </Card>
                <button
                  onClick={() => copyToClipboard(`import * as LD from '@launchdarkly/js-client-sdk';

                  const client = LD.initialize('YOUR_CLIENT_SIDE_ID', {
                    key: 'user-key',
                    email: 'user@example.com'
                  });`, 'ld-init')}

                  style={{ position: 'absolute', top: '6px', right: '6px', background: copiedSnippet === 'ld-init' ? '#4caf50' : '#333', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer', padding: '4px 6px', fontSize: '10px', opacity: '0', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {copiedSnippet === 'ld-init' ? '✓' : 
                    <span style={{ position: 'relative', display: 'inline-block', width: '8px', height: '8px' }}>
                      <span style={{ position: 'absolute', top: '0px', left: '0px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px' }}></span>
                      <span style={{ position: 'absolute', top: '2px', left: '2px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px', backgroundColor: '#333' }}></span>
                    </span>
                  }
                </button>
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <Text fontWeight="fontWeightMedium">3. Resolve mapped content (Contentful REST CDA)</Text>
              <Paragraph marginTop="spacingXs">Evaluate the flag, then fetch the LaunchDarkly Feature Flag entry by key and resolve the mapped entry for the returned variation index.</Paragraph>
              <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button) button.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button) button.style.opacity = '0';
              }}>
                <Card padding="large" style={{ backgroundColor: '#1a1a1a', color: '#e6e6e6', fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '13px', borderRadius: '6px', border: '1px solid #333', whiteSpace: 'pre-wrap', width: '700px', maxWidth: '100%', overflow: 'auto' }}>
                  <div dangerouslySetInnerHTML={{
                    __html: `<code style="color:#e6e6e6; display:block; line-height:1.5; white-space:pre-line;">
                      <span style="color: #6a9955;">// Step 1: Evaluate the LaunchDarkly flag to get the variation value</span>
                      <span style="color: #6a9955;">// This returns the actual value (true/false, string, number, etc.) based on user context</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">variation</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">ldClient</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">variation</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">'your-flag-key'</span><span style="color: #d4d4d4;">,</span> <span style="color: #569cd6;">false</span><span style="color: #d4d4d4;">);</span>

                      <span style="color: #6a9955;">// Step 2: Fetch the LaunchDarkly Feature Flag entry from Contentful</span>
                      <span style="color: #6a9955;">// This contains the flag configuration and content mappings</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">res</span> <span style="color: #d4d4d4;">=</span> <span style="color: #569cd6;">await</span> <span style="color: #9cdcfe;">contentfulClient</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">getEntries</span><span style="color: #d4d4d4;">({</span>
                      &nbsp;&nbsp;<span style="color: #9cdcfe;">content_type</span><span style="color: #d4d4d4;">:</span> <span style="color: #ce9178;">'launchDarklyFeatureFlag'</span><span style="color: #d4d4d4;">,</span> <span style="color: #6a9955;">// Content type created by the app</span>
                      &nbsp;&nbsp;<span style="color: #ce9178;">'fields.key'</span><span style="color: #d4d4d4;">:</span> <span style="color: #ce9178;">'your-flag-key'</span><span style="color: #d4d4d4;">,</span> <span style="color: #6a9955;">// Match the flag key from LaunchDarkly</span>
                      &nbsp;&nbsp;<span style="color: #9cdcfe;">limit</span><span style="color: #d4d4d4;">:</span> <span style="color: #b5cea8;">1</span><span style="color: #d4d4d4;">,</span> <span style="color: #6a9955;">// Only need one entry</span>
                      &nbsp;&nbsp;<span style="color: #9cdcfe;">include</span><span style="color: #d4d4d4;">:</span> <span style="color: #b5cea8;">2</span> <span style="color: #6a9955;">// Include linked entries (content mapping references)</span>
                      <span style="color: #d4d4d4;">});</span>

                      <span style="color: #6a9955;">// Step 3: Validate that the flag entry exists in Contentful</span>
                      <span style="color: #569cd6;">if</span> <span style="color: #d4d4d4;">(!</span><span style="color: #9cdcfe;">res</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">items</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">length</span><span style="color: #d4d4d4;">) {</span>
                      &nbsp;&nbsp;<span style="color: #c586c0;">throw</span> <span style="color: #569cd6;">new</span> <span style="color: #4ec9b0;">Error</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">'Flag not found'</span><span style="color: #d4d4d4;">);</span>
                      <span style="color: #d4d4d4;">}</span>

                      <span style="color: #6a9955;">// Step 4: Extract the flag configuration from Contentful</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">flagEntry</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">res</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">items</span><span style="color: #d4d4d4;">[</span><span style="color: #b5cea8;">0</span><span style="color: #d4d4d4;">];</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">variations</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">flagEntry</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">fields</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">variations</span><span style="color: #d4d4d4;">;</span> <span style="color: #6a9955;">// Array of {value, name} objects</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">contentMapping</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">flagEntry</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">fields</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">contentMapping</span><span style="color: #d4d4d4;">;</span> <span style="color: #6a9955;">// Array of Contentful entry references</span>

                      <span style="color: #6a9955;">// Step 5: Find the index of the variation that matches the LaunchDarkly result</span>
                      <span style="color: #6a9955;">// The array index corresponds to the content mapping index</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">variationIndex</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">variations</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">findIndex</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">v</span> <span style="color: #d4d4d4;">=></span> <span style="color: #9cdcfe;">v</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">value</span> <span style="color: #d4d4d4;">===</span> <span style="color: #9cdcfe;">variation</span><span style="color: #d4d4d4;">);</span>

                      <span style="color: #6a9955;">// Step 6: Validate that we found a matching variation</span>
                      <span style="color: #569cd6;">if</span> <span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">variationIndex</span> <span style="color: #d4d4d4;">===</span> <span style="color: #d4d4d4;">-</span><span style="color: #b5cea8;">1</span><span style="color: #d4d4d4;">) {</span>
                      &nbsp;&nbsp;<span style="color: #c586c0;">throw</span> <span style="color: #569cd6;">new</span> <span style="color: #4ec9b0;">Error</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">'Variation not found'</span><span style="color: #d4d4d4;">);</span>
                      <span style="color: #d4d4d4;">}</span>

                      <span style="color: #6a9955;">// Step 7: Get the mapped content entry using the variation index</span>
                      <span style="color: #6a9955;">// The contentMapping array index matches the variation index</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">mappedLink</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">contentMapping</span><span style="color: #d4d4d4;">[</span><span style="color: #9cdcfe;">variationIndex</span><span style="color: #d4d4d4;">];</span>
                      <span style="color: #6a9955;">// Try to get from included entries first (faster), then fetch if needed</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">mappedEntry</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">res</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">includes</span><span style="color: #d4d4d4;">?.</span><span style="color: #9cdcfe;">Entry</span><span style="color: #d4d4d4;">?.</span><span style="color: #dcdcaa;">find</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">e</span> <span style="color: #d4d4d4;">=></span> 
                      &nbsp;&nbsp;<span style="color: #9cdcfe;">e</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">sys</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">id</span> <span style="color: #d4d4d4;">===</span> <span style="color: #9cdcfe;">mappedLink</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">sys</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">id</span>
                      <span style="color: #d4d4d4;">)</span> <span style="color: #d4d4d4;">||</span> <span style="color: #569cd6;">await</span> <span style="color: #9cdcfe;">contentfulClient</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">getEntry</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">mappedLink</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">sys</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">id</span><span style="color: #d4d4d4;">);</span>

                      <span style="color: #6a9955;">// Step 8: The mappedEntry.fields contains the actual content to render</span>
                      <span style="color: #6a9955;">// Use mappedEntry.fields.title, mappedEntry.fields.description, etc.</span></code>
                    `
                  }} />
                </Card>
                <button
                  onClick={() => copyToClipboard(`// Evaluate flag\nconst variation = ldClient.variation('your-flag-key', false);\n\n// Fetch LD flag entry by key (REST CDA)\nconst res = await contentfulClient.getEntries({\n  content_type: 'launchDarklyFeatureFlag',\n  'fields.key': 'your-flag-key',\n  limit: 1,\n  include: 2\n});\n\nif (!res.items.length) {\n  throw new Error('Flag not found');\n}\n\nconst flagEntry = res.items[0];\nconst variations = flagEntry.fields.variations;\nconst contentMapping = flagEntry.fields.contentMapping;\n\n// Find variation index by matching value\nconst variationIndex = variations.findIndex(v => v.value === variation);\n\nif (variationIndex === -1) {\n  throw new Error('Variation not found');\n}\n\n// Get mapped content entry by index\nconst mappedLink = contentMapping[variationIndex];\nconst mappedEntry = res.includes?.Entry?.find(e => e.sys.id === mappedLink.sys.id)\n  || await contentfulClient.getEntry(mappedLink.sys.id);`, 'fetch-rest')}
                  style={{ position: 'absolute', top: '6px', right: '6px', background: copiedSnippet === 'fetch-rest' ? '#4caf50' : '#333', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer', padding: '4px 6px', fontSize: '10px', opacity: '0', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {copiedSnippet === 'fetch-rest' ? '✓' : 
                    <span style={{ position: 'relative', display: 'inline-block', width: '8px', height: '8px' }}>
                      <span style={{ position: 'absolute', top: '0px', left: '0px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px' }}></span>
                      <span style={{ position: 'absolute', top: '2px', left: '2px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px', backgroundColor: '#333' }}></span>
                    </span>
                  }
                </button>
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <Text fontWeight="fontWeightMedium">4. Resolve mapped content (Contentful GraphQL CDA)</Text>
              <Paragraph marginTop="spacingXs">Fetch the flag entry by key and its mapped entries with a single GraphQL query, then select by variation index.</Paragraph>
              <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={(e) => { const button = e.currentTarget.querySelector('button'); if (button) button.style.opacity = '1'; }} onMouseLeave={(e) => { const button = e.currentTarget.querySelector('button'); if (button) button.style.opacity = '0'; }}>
                <Card padding="large" style={{ backgroundColor: '#1a1a1a', color: '#e6e6e6', fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '13px', borderRadius: '6px', border: '1px solid #333', whiteSpace: 'pre-wrap', width: '700px', maxWidth: '100%', overflow: 'auto' }}>
                  <div dangerouslySetInnerHTML={{
                    __html: `<code style="color:#e6e6e6; display:block; line-height:1.5; white-space:pre-line;">
                      <span style="color: #6a9955;">// GraphQL query to fetch flag configuration and content mappings in one request</span>
                      <span style="color: #6a9955;">// This is more efficient than REST as it gets everything in a single query</span>
                      <span style="color: #569cd6;">query</span> <span style="color: #dcdcaa;">FlagContent</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">$key</span><span style="color: #d4d4d4;">:</span> <span style="color: #4ec9b0;">String!</span><span style="color: #d4d4d4;">) {</span>
                      &nbsp;&nbsp;<span style="color: #6a9955;">// Query the LaunchDarkly Feature Flag content type</span>
                      &nbsp;&nbsp;<span style="color: #9cdcfe;">launchDarklyFeatureFlagCollection</span><span style="color: #d4d4d4;">(</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">where</span><span style="color: #d4d4d4;">: {</span> <span style="color: #9cdcfe;">key</span><span style="color: #d4d4d4;">:</span> <span style="color: #9cdcfe;">$key</span> <span style="color: #d4d4d4;">},</span> <span style="color: #6a9955;">// Filter by flag key</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">limit</span><span style="color: #d4d4d4;">:</span> <span style="color: #b5cea8;">1</span> <span style="color: #6a9955;">// Only need one flag entry</span>
                      &nbsp;&nbsp;<span style="color: #d4d4d4;">) {</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">items</span> <span style="color: #d4d4d4;">{</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">key</span> <span style="color: #6a9955;">// Flag key for verification</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">variations</span> <span style="color: #6a9955;">// Array of variation objects with value and name</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">contentMapping</span> <span style="color: #d4d4d4;">{</span> <span style="color: #6a9955;">// Array of Contentful entry references</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">sys</span> <span style="color: #d4d4d4;">{</span> <span style="color: #9cdcfe;">id</span> <span style="color: #d4d4d4;">}</span> <span style="color: #6a9955;">// Entry ID for fetching content</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">__typename</span> <span style="color: #6a9955;">// Content type name for debugging</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">}</span>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">}</span>
                      &nbsp;&nbsp;<span style="color: #d4d4d4;">}</span>
                      <span style="color: #d4d4d4;">}</span>

                      <span style="color: #6a9955;">// Step 1: Evaluate the LaunchDarkly flag to get the variation value</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">variation</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">ldClient</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">variation</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">'your-flag-key'</span><span style="color: #d4d4d4;">,</span> <span style="color: #569cd6;">false</span><span style="color: #d4d4d4;">);</span>

                      <span style="color: #6a9955;">// Step 2: Validate that the flag entry exists in Contentful</span>
                      <span style="color: #569cd6;">if</span> <span style="color: #d4d4d4;">(!</span><span style="color: #9cdcfe;">data</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">launchDarklyFeatureFlagCollection</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">items</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">length</span><span style="color: #d4d4d4;">) {</span>
                      &nbsp;&nbsp;<span style="color: #c586c0;">throw</span> <span style="color: #569cd6;">new</span> <span style="color: #4ec9b0;">Error</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">'Flag not found'</span><span style="color: #d4d4d4;">);</span>
                      <span style="color: #d4d4d4;">}</span>

                      <span style="color: #6a9955;">// Step 3: Extract the flag configuration from GraphQL response</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">item</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">data</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">launchDarklyFeatureFlagCollection</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">items</span><span style="color: #d4d4d4;">[</span><span style="color: #b5cea8;">0</span><span style="color: #d4d4d4;">];</span>
                      <span style="color: #6a9955;">// Step 4: Find the variation index that matches the LaunchDarkly result</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">variationIndex</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">item</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">variations</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">findIndex</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">v</span> <span style="color: #d4d4d4;">=></span> <span style="color: #9cdcfe;">v</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">value</span> <span style="color: #d4d4d4;">===</span> <span style="color: #9cdcfe;">variation</span><span style="color: #d4d4d4;">);</span>

                      <span style="color: #6a9955;">// Step 5: Validate that we found a matching variation</span>
                      <span style="color: #569cd6;">if</span> <span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">variationIndex</span> <span style="color: #d4d4d4;">===</span> <span style="color: #d4d4d4;">-</span><span style="color: #b5cea8;">1</span><span style="color: #d4d4d4;">) {</span>
                      &nbsp;&nbsp;<span style="color: #c586c0;">throw</span> <span style="color: #569cd6;">new</span> <span style="color: #4ec9b0;">Error</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">'Variation not found'</span><span style="color: #d4d4d4;">);</span>
                      <span style="color: #d4d4d4;">}</span>

                      <span style="color: #6a9955;">// Step 6: Get the mapped content entry reference by index</span>
                      <span style="color: #6a9955;">// Note: You'll need to fetch the actual content using the entry ID</span>
                      <span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">mapped</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">item</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">contentMapping</span><span style="color: #d4d4d4;">[</span><span style="color: #9cdcfe;">variationIndex</span><span style="color: #d4d4d4;">];</span>
                      <span style="color: #6a9955;">// Use mapped.sys.id to fetch the actual content entry</span></code>`
                  }} />
                </Card>
                <button onClick={() => copyToClipboard(`query FlagContent($key: String!) {\n  launchDarklyFeatureFlagCollection(where: { key: $key }, limit: 1) {\n    items {\n      key\n      variations\n      contentMapping {\n        sys { id }\n        __typename\n      }\n    }\n  }\n}\n\n// Get the flag variation from LaunchDarkly\nconst variation = ldClient.variation('your-flag-key', false);\n\nif (!data.launchDarklyFeatureFlagCollection.items.length) {\n  throw new Error('Flag not found');\n}\n\n// Find the matching content for this variation\nconst item = data.launchDarklyFeatureFlagCollection.items[0];\nconst variationIndex = item.variations.findIndex(v => v.value === variation);\n\nif (variationIndex === -1) {\n  throw new Error('Variation not found');\n}\n\n// Get the mapped content entry by index\nconst mapped = item.contentMapping[variationIndex];`, 'fetch-graphql')}
                  style={{ position: 'absolute', top: '6px', right: '6px', background: copiedSnippet === 'fetch-graphql' ? '#4caf50' : '#333', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer', padding: '4px 6px', fontSize: '10px', opacity: '0', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {copiedSnippet === 'fetch-graphql' ? '✓' : 
                    <span style={{ position: 'relative', display: 'inline-block', width: '8px', height: '8px' }}>
                      <span style={{ position: 'absolute', top: '0px', left: '0px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px' }}></span>
                      <span style={{ position: 'absolute', top: '2px', left: '2px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px', backgroundColor: '#333' }}></span>
                    </span>
                  }
                </button>
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <Text fontWeight="fontWeightMedium">5. Complete Implementation Example</Text>
              <Paragraph marginTop="spacingXs">
                Here's a complete function that handles the entire flow from flag evaluation to content retrieval:
              </Paragraph>
              <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button) button.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button) button.style.opacity = '0';
              }}>
                <Card padding="large" style={{ backgroundColor: '#1a1a1a', color: '#e6e6e6', fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '13px', borderRadius: '6px', border: '1px solid #333', whiteSpace: 'pre-wrap', width: '700px', maxWidth: '100%', overflow: 'auto' }}>
                  <div dangerouslySetInnerHTML={{
                    __html: `
                      <code style="color: #e6e6e6; display: block; line-height: 1.5; white-space: pre-line;"><span style="color: #6a9955;">// Complete implementation function that handles the entire flow</span>
                        <span style="color: #6a9955;">// This function can be used directly in your application</span>
                        <span style="color: #569cd6;">async</span> <span style="color: #569cd6;">function</span> <span style="color: #dcdcaa;">getFlaggedContent</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">flagKey</span><span style="color: #d4d4d4;">,</span> <span style="color: #9cdcfe;">defaultValue</span><span style="color: #d4d4d4;">)</span> <span style="color: #d4d4d4;">{</span>
                        &nbsp;&nbsp;<span style="color: #569cd6;">try</span> <span style="color: #d4d4d4;">{</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Step 1: Evaluate the LaunchDarkly flag to get the variation value</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// This is where LaunchDarkly determines which variation the user should see</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">variation</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">ldClient</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">variation</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">flagKey</span><span style="color: #d4d4d4;">,</span> <span style="color: #9cdcfe;">defaultValue</span><span style="color: #d4d4d4;">);</span>
                        
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Step 2: Fetch the flag configuration from Contentful</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// This contains the variations array and content mapping array</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">res</span> <span style="color: #d4d4d4;">=</span> <span style="color: #569cd6;">await</span> <span style="color: #9cdcfe;">contentfulClient</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">getEntries</span><span style="color: #d4d4d4;">({</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">content_type</span><span style="color: #d4d4d4;">:</span> <span style="color: #ce9178;">'launchDarklyFeatureFlag'</span><span style="color: #d4d4d4;">,</span> <span style="color: #6a9955;">// Content type created by the app</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #ce9178;">'fields.key'</span><span style="color: #d4d4d4;">:</span> <span style="color: #9cdcfe;">flagKey</span><span style="color: #d4d4d4;">,</span> <span style="color: #6a9955;">// Match the flag key from LaunchDarkly</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">limit</span><span style="color: #d4d4d4;">:</span> <span style="color: #b5cea8;">1</span><span style="color: #d4d4d4;">,</span> <span style="color: #6a9955;">// Only need one entry</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">include</span><span style="color: #d4d4d4;">:</span> <span style="color: #b5cea8;">2</span> <span style="color: #6a9955;">// Include linked entries for performance</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">});</span>
                        
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Step 3: Validate that the flag entry exists in Contentful</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">if</span> <span style="color: #d4d4d4;">(!</span><span style="color: #9cdcfe;">res</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">items</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">length</span><span style="color: #d4d4d4;">) {</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #c586c0;">throw</span> <span style="color: #569cd6;">new</span> <span style="color: #4ec9b0;">Error</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">\`Flag \${flagKey} not found in Contentful\`</span><span style="color: #d4d4d4;">);</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">}</span>
                        
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Step 4: Extract the flag configuration from Contentful</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">flagEntry</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">res</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">items</span><span style="color: #d4d4d4;">[</span><span style="color: #b5cea8;">0</span><span style="color: #d4d4d4;">];</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">variations</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">flagEntry</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">fields</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">variations</span><span style="color: #d4d4d4;">;</span> <span style="color: #6a9955;">// Array of {value, name} objects</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">contentMapping</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">flagEntry</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">fields</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">contentMapping</span><span style="color: #d4d4d4;">;</span> <span style="color: #6a9955;">// Array of Contentful entry references</span>
                        
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Step 5: Find the index of the variation that matches LaunchDarkly result</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// The array index corresponds to the content mapping index</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">variationIndex</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">variations</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">findIndex</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">v</span> <span style="color: #d4d4d4;">=></span> <span style="color: #9cdcfe;">v</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">value</span> <span style="color: #d4d4d4;">===</span> <span style="color: #9cdcfe;">variation</span><span style="color: #d4d4d4;">);</span>
                        
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Step 6: Validate that we found a matching variation</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">if</span> <span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">variationIndex</span> <span style="color: #d4d4d4;">===</span> <span style="color: #d4d4d4;">-</span><span style="color: #b5cea8;">1</span><span style="color: #d4d4d4;">) {</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #c586c0;">throw</span> <span style="color: #569cd6;">new</span> <span style="color: #4ec9b0;">Error</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">\`Variation \${variation} not found in flag configuration\`</span><span style="color: #d4d4d4;">);</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">}</span>
                        
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Step 7: Get the mapped content entry using the variation index</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">mappedLink</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">contentMapping</span><span style="color: #d4d4d4;">[</span><span style="color: #9cdcfe;">variationIndex</span><span style="color: #d4d4d4;">];</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Try to get from included entries first (faster), then fetch if needed</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">mappedEntry</span> <span style="color: #d4d4d4;">=</span> <span style="color: #9cdcfe;">res</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">includes</span><span style="color: #d4d4d4;">?.</span><span style="color: #9cdcfe;">Entry</span><span style="color: #d4d4d4;">?.</span><span style="color: #dcdcaa;">find</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">e</span> <span style="color: #d4d4d4;">=></span> 
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #9cdcfe;">e</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">sys</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">id</span> <span style="color: #d4d4d4;">===</span> <span style="color: #9cdcfe;">mappedLink</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">sys</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">id</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">)</span> <span style="color: #d4d4d4;">||</span> <span style="color: #569cd6;">await</span> <span style="color: #9cdcfe;">contentfulClient</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">getEntry</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">mappedLink</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">sys</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">id</span><span style="color: #d4d4d4;">);</span>
                        
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Step 8: Return the mapped content entry</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// The entry.fields contains the actual content to render</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #c586c0;">return</span> <span style="color: #9cdcfe;">mappedEntry</span><span style="color: #d4d4d4;">;</span>
                        &nbsp;&nbsp;<span style="color: #d4d4d4;">}</span> <span style="color: #569cd6;">catch</span> <span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">error</span><span style="color: #d4d4d4;">)</span> <span style="color: #d4d4d4;">{</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Handle any errors gracefully</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">console</span><span style="color: #d4d4d4;">.</span><span style="color: #dcdcaa;">error</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">'Error getting flagged content:'</span><span style="color: #d4d4d4;">,</span> <span style="color: #9cdcfe;">error</span><span style="color: #d4d4d4;">);</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #c586c0;">return</span> <span style="color: #569cd6;">null</span><span style="color: #d4d4d4;">;</span>
                        &nbsp;&nbsp;<span style="color: #d4d4d4;">}</span>
                        <span style="color: #d4d4d4;">}</span>
                      </code>
                    `
                  }} />
                </Card>
                <button
                  onClick={() => copyToClipboard(`async function getFlaggedContent(flagKey, defaultValue) {\n  try {\n    // 1. Evaluate the flag\n    const variation = ldClient.variation(flagKey, defaultValue);\n    \n    // 2. Fetch flag configuration from Contentful\n    const res = await contentfulClient.getEntries({\n      content_type: 'launchDarklyFeatureFlag',\n      'fields.key': flagKey,\n      limit: 1,\n      include: 2\n    });\n    \n    if (!res.items.length) {\n      throw new Error(\`Flag \${flagKey} not found\`);\n    }\n    \n    const flagEntry = res.items[0];\n    const variations = flagEntry.fields.variations;\n    const contentMapping = flagEntry.fields.contentMapping;\n    \n    // 3. Find variation index\n    const variationIndex = variations.findIndex(v => v.value === variation);\n    \n    if (variationIndex === -1) {\n      throw new Error(\`Variation \${variation} not found\`);\n    }\n    \n    // 4. Get mapped content entry\n    const mappedLink = contentMapping[variationIndex];\n    const mappedEntry = res.includes?.Entry?.find(e => e.sys.id === mappedLink.sys.id)\n      || await contentfulClient.getEntry(mappedLink.sys.id);\n    \n    return mappedEntry;\n  } catch (error) {\n    console.error('Error getting flagged content:', error);\n    return null;\n  }\n}`, 'content-mapping')}
                  style={{ position: 'absolute', top: '6px', right: '6px', background: copiedSnippet === 'content-mapping' ? '#4caf50' : '#333', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer', padding: '4px 6px', fontSize: '10px', opacity: '0', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {copiedSnippet === 'content-mapping' ? '✓' : 
                    <span style={{ position: 'relative', display: 'inline-block', width: '8px', height: '8px' }}>
                      <span style={{ position: 'absolute', top: '0px', left: '0px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px' }}></span>
                      <span style={{ position: 'absolute', top: '2px', left: '2px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px', backgroundColor: '#333' }}></span>
                    </span>
                  }
                </button>
              </div>
            </div>

            <div style={{ width: '100%' }}>
              <Text fontWeight="fontWeightMedium">6. React Example</Text>
              <Paragraph marginTop="spacingXs">
                Here&#39;s a complete React component example:
              </Paragraph>
              <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button) button.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button) button.style.opacity = '0';
              }}>
                <Card padding="large" style={{ backgroundColor: '#1a1a1a', color: '#e6e6e6', fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '13px', borderRadius: '6px', border: '1px solid #333', whiteSpace: 'pre-wrap', width: '700px', maxWidth: '100%', overflow: 'auto' }}>
                  <div dangerouslySetInnerHTML={{
                    __html: `
                      <code style="color: #e6e6e6; display: block; line-height: 1.5; white-space: pre-line;"><span style="color: #6a9955;">// React component that demonstrates how to use the getFlaggedContent function</span>
                        <span style="color: #6a9955;">// This shows a complete React implementation with proper state management</span>
                        <span style="color: #c586c0;">import</span> <span style="color: #d4d4d4;">{</span> <span style="color: #9cdcfe;">useState</span><span style="color: #d4d4d4;">,</span> <span style="color: #9cdcfe;">useEffect</span> <span style="color: #d4d4d4;">}</span> <span style="color: #c586c0;">from</span> <span style="color: #ce9178;">'react'</span><span style="color: #d4d4d4;">;</span>
                        <span style="color: #c586c0;">import</span> <span style="color: #569cd6;">*</span> <span style="color: #c586c0;">as</span> <span style="color: #4ec9b0;">LD</span> <span style="color: #c586c0;">from</span> <span style="color: #ce9178;">'@launchdarkly/js-client-sdk'</span><span style="color: #d4d4d4;">;</span>
                        
                        <span style="color: #569cd6;">function</span> <span style="color: #dcdcaa;">DynamicContent</span><span style="color: #d4d4d4;">({</span> <span style="color: #9cdcfe;">flagKey</span><span style="color: #d4d4d4;">,</span> <span style="color: #9cdcfe;">defaultValue</span> <span style="color: #d4d4d4;">=</span> <span style="color: #569cd6;">false</span> <span style="color: #d4d4d4;">}) {</span>
                        &nbsp;&nbsp;<span style="color: #6a9955;">// State management for the component</span>
                        &nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #d4d4d4;">[</span><span style="color: #9cdcfe;">content</span><span style="color: #d4d4d4;">,</span> <span style="color: #9cdcfe;">setContent</span><span style="color: #d4d4d4;">]</span> <span style="color: #d4d4d4;">=</span> <span style="color: #dcdcaa;">useState</span><span style="color: #d4d4d4;">(</span><span style="color: #569cd6;">null</span><span style="color: #d4d4d4;">);</span> <span style="color: #6a9955;">// Stores the fetched content fields</span>
                        &nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #d4d4d4;">[</span><span style="color: #9cdcfe;">loading</span><span style="color: #d4d4d4;">,</span> <span style="color: #9cdcfe;">setLoading</span><span style="color: #d4d4d4;">]</span> <span style="color: #d4d4d4;">=</span> <span style="color: #dcdcaa;">useState</span><span style="color: #d4d4d4;">(</span><span style="color: #569cd6;">true</span><span style="color: #d4d4d4;">);</span> <span style="color: #6a9955;">// Loading state for UI feedback</span>
                        &nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #d4d4d4;">[</span><span style="color: #9cdcfe;">error</span><span style="color: #d4d4d4;">,</span> <span style="color: #9cdcfe;">setError</span><span style="color: #d4d4d4;">]</span> <span style="color: #d4d4d4;">=</span> <span style="color: #dcdcaa;">useState</span><span style="color: #d4d4d4;">(</span><span style="color: #569cd6;">null</span><span style="color: #d4d4d4;">);</span> <span style="color: #6a9955;">// Error state for error handling</span>
                        
                        &nbsp;&nbsp;<span style="color: #6a9955;">// Effect hook to fetch content when component mounts or flagKey changes</span>
                        &nbsp;&nbsp;<span style="color: #dcdcaa;">useEffect</span><span style="color: #d4d4d4;">(() => {</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #dcdcaa;">loadContent</span> <span style="color: #d4d4d4;">=</span> <span style="color: #569cd6;">async</span> <span style="color: #d4d4d4;">() => {</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">try</span> <span style="color: #d4d4d4;">{</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Reset states and start loading</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #dcdcaa;">setLoading</span><span style="color: #d4d4d4;">(</span><span style="color: #569cd6;">true</span><span style="color: #d4d4d4;">);</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #dcdcaa;">setError</span><span style="color: #d4d4d4;">(</span><span style="color: #569cd6;">null</span><span style="color: #d4d4d4;">);</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Use the complete implementation function to get flagged content</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">const</span> <span style="color: #9cdcfe;">entry</span> <span style="color: #d4d4d4;">=</span> <span style="color: #569cd6;">await</span> <span style="color: #dcdcaa;">getFlaggedContent</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">flagKey</span><span style="color: #d4d4d4;">,</span> <span style="color: #9cdcfe;">defaultValue</span><span style="color: #d4d4d4;">);</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Success: store the content fields for rendering</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #569cd6;">if</span> <span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">entry</span><span style="color: #d4d4d4;">)</span> <span style="color: #d4d4d4;">{</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #dcdcaa;">setContent</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">entry</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">fields</span><span style="color: #d4d4d4;">);</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">}</span> <span style="color: #569cd6;">else</span> <span style="color: #d4d4d4;">{</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// No content found: set error state</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #dcdcaa;">setError</span><span style="color: #d4d4d4;">(</span><span style="color: #ce9178;">'Failed to load content'</span><span style="color: #d4d4d4;">);</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">}</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">}</span> <span style="color: #569cd6;">catch</span> <span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">err</span><span style="color: #d4d4d4;">)</span> <span style="color: #d4d4d4;">{</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Error occurred: set error message</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #dcdcaa;">setError</span><span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">err</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">message</span><span style="color: #d4d4d4;">);</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">}</span> <span style="color: #569cd6;">finally</span> <span style="color: #d4d4d4;">{</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Always stop loading, regardless of success or failure</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #dcdcaa;">setLoading</span><span style="color: #d4d4d4;">(</span><span style="color: #569cd6;">false</span><span style="color: #d4d4d4;">);</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">}</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">};</span>
                        
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #6a9955;">// Call the async function to load content</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #dcdcaa;">loadContent</span><span style="color: #d4d4d4;">();</span>
                        &nbsp;&nbsp;<span style="color: #d4d4d4;">},</span> <span style="color: #d4d4d4;">[</span><span style="color: #9cdcfe;">flagKey</span><span style="color: #d4d4d4;">]);</span> <span style="color: #6a9955;">// Re-run when flagKey changes</span>
                        
                        &nbsp;&nbsp;<span style="color: #6a9955;">// Loading state: show loading indicator while fetching content</span>
                        &nbsp;&nbsp;<span style="color: #569cd6;">if</span> <span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">loading</span><span style="color: #d4d4d4;">)</span> <span style="color: #c586c0;">return</span> <span style="color: #d4d4d4;">&lt;</span><span style="color: #4ec9b0;">div</span><span style="color: #d4d4d4;">&gt;</span>Loading...<span style="color: #d4d4d4;">&lt;/</span><span style="color: #4ec9b0;">div</span><span style="color: #d4d4d4;">&gt;;</span>
                        &nbsp;&nbsp;<span style="color: #6a9955;">// Error state: show error message if something went wrong</span>
                        &nbsp;&nbsp;<span style="color: #569cd6;">if</span> <span style="color: #d4d4d4;">(</span><span style="color: #9cdcfe;">error</span><span style="color: #d4d4d4;">)</span> <span style="color: #c586c0;">return</span> <span style="color: #d4d4d4;">&lt;</span><span style="color: #4ec9b0;">div</span><span style="color: #d4d4d4;">&gt;</span>Error: <span style="color: #d4d4d4;">{</span><span style="color: #9cdcfe;">error</span><span style="color: #d4d4d4;">}&lt;/</span><span style="color: #4ec9b0;">div</span><span style="color: #d4d4d4;">&gt;;</span>
                        &nbsp;&nbsp;<span style="color: #6a9955;">// No content state: handle case where no content was found</span>
                        &nbsp;&nbsp;<span style="color: #569cd6;">if</span> <span style="color: #d4d4d4;">(</span><span style="color: #d4d4d4;">!</span><span style="color: #9cdcfe;">content</span><span style="color: #d4d4d4;">)</span> <span style="color: #c586c0;">return</span> <span style="color: #d4d4d4;">&lt;</span><span style="color: #4ec9b0;">div</span><span style="color: #d4d4d4;">&gt;</span>No content available<span style="color: #d4d4d4;">&lt;/</span><span style="color: #4ec9b0;">div</span><span style="color: #d4d4d4;">&gt;;</span>
                        
                        &nbsp;&nbsp;<span style="color: #6a9955;">// Success state: render the content from Contentful</span>
                        &nbsp;&nbsp;<span style="color: #6a9955;">// The content object contains the fields from the mapped Contentful entry</span>
                        &nbsp;&nbsp;<span style="color: #c586c0;">return</span> <span style="color: #d4d4d4;">(</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">&lt;</span><span style="color: #4ec9b0;">div</span><span style="color: #d4d4d4;">&gt;</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">&lt;</span><span style="color: #4ec9b0;">h1</span><span style="color: #d4d4d4;">&gt;{</span><span style="color: #9cdcfe;">content</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">title</span><span style="color: #d4d4d4;">}&lt;/</span><span style="color: #4ec9b0;">h1</span><span style="color: #d4d4d4;">&gt;</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">&lt;</span><span style="color: #4ec9b0;">p</span><span style="color: #d4d4d4;">&gt;{</span><span style="color: #9cdcfe;">content</span><span style="color: #d4d4d4;">.</span><span style="color: #9cdcfe;">description</span><span style="color: #d4d4d4;">}&lt;/</span><span style="color: #4ec9b0;">p</span><span style="color: #d4d4d4;">&gt;</span>
                        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #d4d4d4;">&lt;/</span><span style="color: #4ec9b0;">div</span><span style="color: #d4d4d4;">&gt;</span>
                        &nbsp;&nbsp;<span style="color: #d4d4d4;">);</span>
                        <span style="color: #d4d4d4;">}</span>
                        <span style="color: #6a9955;">// Usage: <DynamicContent flagKey="your-flag-key" defaultValue={false} /></span>
                      </code>
                    `
                  }} />
                </Card>
                <button
                  onClick={() => copyToClipboard(`import { useState, useEffect } from 'react';
import * as LD from '@launchdarkly/js-client-sdk';

function DynamicContent({ flagKey, defaultValue = false }) {
                    const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

                    useEffect(() => {
                      const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the complete implementation function
        const entry = await getFlaggedContent(flagKey, defaultValue);

        if (entry) {
                        setContent(entry.fields);
        } else {
          setError('Failed to load content');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
                      };

                      loadContent();
                    }, [flagKey]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!content) return <div>No content available</div>;

                    return (
                      <div>
                        <h1>{content.title}</h1>
                        <p>{content.description}</p>
                      </div>
                    );
                  }`, 'react-example')}

                  style={{ position: 'absolute', top: '6px', right: '6px', background: copiedSnippet === 'react-example' ? '#4caf50' : '#333', border: 'none', borderRadius: '3px', color: '#fff', cursor: 'pointer', padding: '4px 6px', fontSize: '10px', opacity: '0', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {copiedSnippet === 'react-example' ? '✓' : 
                    <span style={{ position: 'relative', display: 'inline-block', width: '8px', height: '8px' }}>
                      <span style={{ position: 'absolute', top: '0px', left: '0px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px' }}></span>
                      <span style={{ position: 'absolute', top: '2px', left: '2px', width: '6px', height: '6px', border: '1px solid #fff', borderRadius: '1px', backgroundColor: '#333' }}></span>
                    </span>
                  }
                </button>
              </div>
            </div>

            <Note variant="primary">
              <Text fontWeight="fontWeightMedium">Pro Tip:</Text>
              <Paragraph marginTop="spacingXs" style={{ marginTop: '0px' }}>
                Use LaunchDarkly&#39;s real-time updates to change content without redeploying your app. 
                The SDK will automatically receive flag changes and you can update content accordingly.
              </Paragraph>
            </Note>
          </Stack>
        </Card>

        <Note variant="neutral">
          <Text fontWeight="fontWeightMedium">Need Help?</Text>
          <Paragraph marginTop="spacingXs">
            Reach out to your LaunchDarkly account manager to get help with your LaunchDarkly account or to get assistance with this app.
          </Paragraph>
        </Note>
      </Stack>
      </div>
    </ErrorBoundary>
  );
};

export default PageComponent;
