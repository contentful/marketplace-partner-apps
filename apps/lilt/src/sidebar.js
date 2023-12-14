import React from 'react';
import PropTypes from 'prop-types';

import { LiltCreateButton, LocalizeButton, ManageEntriesButton } from './buttons';
import { LiltMeta } from './lilt';
import { LiltStatus } from './status';
import { LiltProgress } from './progress';
import { WorkflowSteps } from './workflow-steps';
import { DateLastCompleted, DateLastPublished, DateLastSent } from './dates';
import { ContentChangedWarning } from './warnings';
import { PRE_SUBMISSION_STATUSES, DIALOG_TYPES } from './constants';
import CMClient from './contentful-management-client';
import { Button } from '@contentful/forma-36-react-components';
import tokens from '@contentful/f36-tokens';

const BASE_URL = process.env.CONNECTORS_BASE_URL;
const getTermsAndConditions = `${BASE_URL}/proxy/create/terms-and-conditions`;

/**
 * @typedef {object} Props
 * @prop {import('contentful-ui-extensions-sdk').KnownSDK} sdk
 * @extends {React.Component<Props>}
 */
export class SidebarExtension extends React.Component {
  cmClient;

  constructor(props) {
    super(props);

    const { sdk } = this.props;
    const { fields } = sdk.entry;
    const hasLiltStatus = typeof fields.lilt_status !== 'undefined';
    const hasLiltMeta = typeof fields.lilt_metadata !== 'undefined';

    const initialState = {
      liltStatus: '',
      liltMeta: LiltMeta.initialValues(),
      userCanPublish: false,
      userCanUpdate: false,
      publish: false,
      reload: false,
      initialized: false,
      showManageEntries: false
    };

    this.cmClient = new CMClient(sdk);

    if (hasLiltStatus) {
      initialState.liltStatus = fields.lilt_status.getValue();
    }

    if (hasLiltMeta && fields.lilt_metadata.getValue()) {
      const metadata = fields.lilt_metadata.getValue();
      initialState.liltMeta = LiltMeta.fromEntry(metadata);
    }

    this.state = initialState;
    this.updateStatus = this.updateStatus.bind(this);
    this.startJob = this.startJob.bind(this);
    this.cancelJob = this.cancelJob.bind(this);
    this.completeJob = this.completeJob.bind(this);
    this.approveLocale = this.approveLocale.bind(this);
    this.rejectLocale = this.rejectLocale.bind(this);
    this.handleStatusChange = this.handleStatusChange.bind(this);
    this.handleMetadataChange = this.handleMetadataChange.bind(this);
    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.handlePublish = this.handlePublish.bind(this);
    this.handleDismissWarning = this.handleDismissWarning.bind(this);
    this.handleManageEntries = this.handleManageEntries.bind(this);
    this.handleSignIn = this.handleSignIn.bind(this);
    this.handleLiltCreate = this.handleLiltCreate.bind(this);
    this.handleSendForLocalization = this.handleSendForLocalization.bind(this);
    this.createLiltStatus = this.createLiltStatus.bind(this);
    this.createLiltMetadata = this.createLiltMetadata.bind(this);
  }

  async updateStatus(status) {
    const { sdk } = this.props;
    const { fields } = sdk.entry;
    await fields.lilt_status.setValue(status);
  }

  /**
   * If 'entry' is supplied, the method will start a job
   * for that supplied entry. Else a job will start for the
   * currently accessed entry.
   * If there are 'targetLocales', they will be saved on the
   * entry and used in the job.
   * @param {object} configuration
   * @param {string[]} configuration.targetLocales
   * @param {string} [configuration.domain]
   * @param {import('contentful-ui-extensions-sdk').Entry} entry
   * @returns
   */
  async startJob(configuration, entry) {
    const { targetLocales, useInstant, domain } = configuration;
    const now = new Date();
    const { sdk } = this.props;
    const { email } = sdk.user;

    if (entry) {
      const defaultLocale = sdk.locales.default;
      if (!entry.fields.lilt_metadata) {
        entry.fields.lilt_metadata = {};
      }
      if (!entry.fields.lilt_metadata[defaultLocale]) {
        entry.fields.lilt_metadata[defaultLocale] = LiltMeta.initialValues();
      }
      entry.fields.lilt_metadata[defaultLocale].last_sent_at = now.toISOString();
      entry.fields.lilt_metadata[defaultLocale].changed_since_sent = false;
      if (targetLocales.length) {
        entry.fields.lilt_metadata[defaultLocale].target_locales = targetLocales;
      }
      entry.fields.lilt_metadata[defaultLocale].reporter_email = email;
      if (!entry.fields.lilt_status) {
        entry.fields.lilt_status = {};
      }
      entry.fields.lilt_status = {
        ...entry.fields.lilt_status,
        [defaultLocale]: WorkflowSteps.READY_TO_START
      };
      if (typeof domain == 'string') {
        entry.fields.lilt_metadata[defaultLocale].domain = domain;
      }
      entry.fields.lilt_metadata[defaultLocale].is_instant_translation = useInstant;
      return await this.cmClient.updateEntry(entry);
    } else {
      const { fields } = sdk.entry;
      const liltMeta = fields.lilt_metadata.getValue();
      liltMeta.last_sent_at = now.toISOString();
      liltMeta.changed_since_sent = false;
      if (targetLocales.length) {
        liltMeta.target_locales = targetLocales;
      }
      if (typeof domain == 'string') {
        liltMeta.domain = domain;
      }
      liltMeta.reporter_email = email;
      liltMeta.is_instant_translation = useInstant;
      await fields.lilt_metadata.setValue(liltMeta);

      this.setState({ publish: false }, async () => {
        await this.updateStatus(WorkflowSteps.READY_TO_START);
      });
    }
  }

  async cancelJob() {
    await this.updateStatus(WorkflowSteps.NEEDS_LOCALIZATION);
  }

  async completeJob() {
    const { sdk } = this.props;
    const { fields } = sdk.entry;

    const dateLocalized = new Date();
    // This makes it so the last completed date is slightly greater than the
    // last published date. Otherwise the last published date would always
    // be greater than the last completed date.
    dateLocalized.setSeconds(dateLocalized.getSeconds() + 10);
    const liltMeta = fields.lilt_metadata.getValue();
    liltMeta.last_completed_job = dateLocalized.toISOString();
    liltMeta.progress = {};
    await fields.lilt_metadata.setValue(liltMeta);

    const newStatus = liltMeta.changed_since_sent
      ? WorkflowSteps.NEEDS_LOCALIZATION
      : WorkflowSteps.COMPLETE;
    await this.updateStatus(newStatus);
  }

  async approveLocale(locale) {
    const { sdk } = this.props;
    const { fields } = sdk.entry;
    const liltMeta = fields.lilt_metadata.getValue();
    liltMeta.progress[locale] = 'Done';
    await fields.lilt_metadata.setValue(liltMeta);
  }

  async rejectLocale(locale, feedback) {
    const { sdk } = this.props;
    const { fields } = sdk.entry;
    const liltMeta = fields.lilt_metadata.getValue();
    if (!liltMeta.progress) {
      liltMeta.progress = {};
    }
    liltMeta.progress[locale] = 'In Progress';
    if (!liltMeta.feedback) {
      liltMeta.feedback = {};
    }
    liltMeta.feedback[locale] = feedback;
    await fields.lilt_metadata.setValue(liltMeta);
  }

  handleStatusChange(value) {
    this.setState({ liltStatus: value });
  }

  handleMetadataChange(value) {
    if (!value) {
      return;
    }
    const liltMeta = LiltMeta.fromEntry(value);
    this.setState({ liltMeta });
  }

  async handleFieldChange() {
    const { initialized, liltStatus } = this.state;

    if (!initialized) {
      return;
    }

    const { lilt_metadata } = this.props.sdk.entry.fields;
    const liltMeta = lilt_metadata.getValue();
    const isInWarningStatus = liltStatus && !PRE_SUBMISSION_STATUSES.includes(liltStatus);
    if (isInWarningStatus && liltMeta.last_sent_at) {
      liltMeta.changed_since_sent = true;
      await lilt_metadata.setValue(liltMeta);
    }

    if (liltStatus !== WorkflowSteps.COMPLETE) {
      return;
    }

    await this.updateStatus(WorkflowSteps.NEEDS_LOCALIZATION);
  }

  async handlePublish(meta) {
    const { sdk } = this.props;
    const { publish } = this.state;

    if (!publish) {
      return;
    }

    this.setState({ publish: false }, async () => {
      const entrySys = sdk.entry.getSys();
      const entryId = entrySys.id;
      const entry = await sdk.space.getEntry(entryId);
      entry.sys.version = meta.version;
      await sdk.space.publishEntry(entry);
    });
  }

  async handleDismissWarning() {
    const { dialogs, entry } = this.props.sdk;
    const isConfirmed = await dialogs.openConfirm({
      title: 'Are you sure?',
      message: 'Confirming this action will dismiss the warning for all users.'
    });

    if (isConfirmed) {
      const { fields } = entry;
      let liltMeta = fields.lilt_metadata.getValue();
      liltMeta.changed_since_sent = false;
      await fields.lilt_metadata.setValue(liltMeta);
    }
  }

  async handleLiltCreate() {
    const { dialogs, ids } = this.props.sdk;
    await dialogs.openCurrentApp({
      parameters: {
        type: DIALOG_TYPES.LILT_CREATE,
        entryId: ids.entry
      },
      width: '960px'
    });
  }

  async handleManageEntries() {
    const { dialogs, ids, locales } = this.props.sdk;
    const { domain } = this.props.sdk.entry.fields.lilt_metadata.getValue();
    const { selectedEntries, isSubmittedSelected } = await dialogs.openCurrentApp({
      parameters: {
        type: DIALOG_TYPES.ENTRY_SELECTOR,
        entryId: ids.entry
      },
      width: 'fullWidth'
    });

    if (!selectedEntries) return;

    if (isSubmittedSelected) {
      const message = `Looks like you’ve selected some content that has been submitted for translation
        before. Sending same content multiple times can lead to unexpected outcomes, e.g. content being
        overwritten. Are you sure you want to continue?`;
      const isConfirmed = await dialogs.openConfirm({
        title: 'Are you sure?',
        message,
        confirmLabel: 'Yes, continue',
        cancelLabel: 'No, go back'
      });

      if (!isConfirmed) {
        // go back
        this.handleManageEntries();
        return;
      }
    }

    const selectable = Object.entries(locales.names)
      // remove the default locale
      .filter(([locale]) => locale !== locales.default)
      // map to an object
      .map(([locale, name]) => ({
        locale,
        name
      }));
    const configuration = await dialogs.openCurrentApp({
      parameters: {
        type: DIALOG_TYPES.SEND_MULTIPLE_FOR_LOCALIZATION,
        selected: [],
        selectable,
        useInstant: false,
        entryId: ids.entry,
        domain
      }
    });

    if (!configuration) return;

    const jobs = selectedEntries.map(entry => this.startJob(configuration, entry));
    await Promise.all(jobs);
  }

  async handleSendForLocalization() {
    const { dialogs, entry, locales } = this.props.sdk;
    const { lilt_metadata } = entry.fields;
    const { target_locales, is_instant_translation, domain } = lilt_metadata.getValue();
    const selected = target_locales;
    const useInstant = is_instant_translation;
    const selectable = Object.entries(locales.names)
      // remove the default locale
      .filter(([locale]) => locale !== locales.default)
      // map to an object
      .map(([locale, name]) => ({
        locale,
        name
      }));
    const entrySys = entry.getSys();
    const entryId = entrySys.id;
    const configuration = await dialogs.openCurrentApp({
      parameters: {
        type: DIALOG_TYPES.SEND_FOR_LOCALIZATION,
        selected,
        selectable,
        useInstant,
        entryId,
        domain
      }
    });

    if (!configuration) return;

    await this.startJob(configuration);
  }

  async handleSignIn() {
    this.props.sdk.navigator.openAppConfig();
  }

  async createLiltStatus() {
    const { sdk } = this.props;
    const contentTypeId = sdk.ids.contentType;
    const contentType = await sdk.space.getContentType(contentTypeId);
    const liltStatus = {
      id: 'lilt_status',
      name: 'Lilt Status',
      type: 'Symbol',
      disabled: false,
      omitted: true
    };
    contentType.fields.push(liltStatus);
    await sdk.space.updateContentType(contentType);
  }

  async createLiltMetadata() {
    const { sdk } = this.props;
    const contentTypeId = sdk.ids.contentType;
    const contentType = await sdk.space.getContentType(contentTypeId);
    const liltMetadata = {
      id: 'lilt_metadata',
      name: 'Lilt Metadata',
      type: 'Object',
      disabled: true,
      omitted: true
    };
    contentType.fields.push(liltMetadata);
    await sdk.space.updateContentType(contentType);
  }

  async componentDidMount() {
    const { sdk } = this.props;
    const { fields } = sdk.entry;
    const hasLiltStatus = typeof fields.lilt_status !== 'undefined';
    const hasLiltMeta = typeof fields.lilt_metadata !== 'undefined';

    if (!hasLiltStatus && !hasLiltMeta) {
      await this.createLiltStatus();
      await this.createLiltMetadata();
      this.setState({ reload: true });
      return;
    }

    await this.initMetaData();

    await this.initTargetLocales();

    const hasLiltCreateAccess = await this.verifyLiltCreateAccess();

    for (const fieldName in fields) {
      const field = fields[fieldName];
      if (field.locales.length === 1) {
        continue;
      }
      field.onValueChanged(this.handleFieldChange);
    }

    fields.lilt_status.onValueChanged(this.handleStatusChange);
    fields.lilt_metadata.onValueChanged(this.handleMetadataChange);
    sdk.entry.onSysChanged(this.handlePublish);

    const { contentType, entry } = sdk.ids;
    const userCanPublish = await sdk.access.can('publish', {
      sys: {
        type: 'Entry',
        contentType: {
          sys: { id: contentType, type: 'Link', linkType: 'ContentType' }
        }
      }
    });
    const userCanUpdate = await sdk.access.can('update', {
      sys: {
        type: 'Entry',
        contentType: {
          sys: { id: contentType, type: 'Link', linkType: 'ContentType' }
        }
      }
    });
    const { items: releases } = await this.cmClient.getReleasesByEntryId(entry);
    const showManageEntries = !!releases && !!releases.length;

    this.setState({
      userCanPublish,
      userCanUpdate,
      initialized: true,
      showManageEntries,
      hasLiltCreateAccess
    });
  }

  /**
   * creates a lilt_metadata in the entry, if not created
   */
  async initMetaData() {
    const { lilt_metadata } = this.props.sdk.entry.fields;
    if (!lilt_metadata.getValue()) {
      await lilt_metadata.setValue(LiltMeta.initialValues());
    }
  }

  /**
   * initializes the target locales of the job
   * if a locales has been disabled by the user, it will be
   * removed from the target_locales metadata
   */
  async initTargetLocales() {
    const { locales, entry } = this.props.sdk;
    const { lilt_metadata } = entry.fields;
    const availableLocales = locales.available.filter(a => a !== locales.default);
    const liltMeta = lilt_metadata.getValue();

    const wasInitialized = Array.isArray(liltMeta.target_locales) && liltMeta.target_locales.length;
    if (wasInitialized) {
      // ensure no disabled/removed locales are included
      const isLocaleAvailable = locale => availableLocales.includes(locale);
      liltMeta.target_locales = liltMeta.target_locales.filter(isLocaleAvailable);
    } else {
      // set the targets to the available locales when the entry is created
      liltMeta.target_locales = availableLocales;
    }

    await lilt_metadata.setValue(liltMeta);
  }

  async verifyLiltCreateAccess() {
    const { liltConnectorToken } = this.props.sdk.parameters.installation;

    if (!liltConnectorToken) {
      return false;
    }

    const response = await fetch(getTermsAndConditions, {
      headers: {
        Authorization: `Bearer ${liltConnectorToken}`
      }
    });

    if (response.status === 404) {
      return false;
    }

    return true;
  }

  render() {
    const { sdk } = this.props;
    const { fields } = sdk.entry;
    const { userCanPublish, userCanUpdate, showManageEntries, hasLiltCreateAccess } = this.state;
    const { liltMeta, liltStatus, reload, initialized } = this.state;
    const entrySys = sdk.entry.getSys();
    const isPublished = entrySys.publishedCounter > 0;
    const availableLocales = liltMeta.target_locales;
    const defaultLocale = sdk.locales.default;

    const { liltConnectorToken, liltApiKey } = sdk.parameters.installation;
    const hasLiltConnectorToken = typeof liltConnectorToken !== 'undefined';
    const hasLiltApiKey = typeof liltApiKey !== 'undefined';
    const isAuthenticated = hasLiltConnectorToken || hasLiltApiKey;

    if (!isAuthenticated) {
      return (
        <div>
          <p>
            The Lilt app makes it easy for you to send content to Lilt for translation right from
            within Contentful, saving you time while letting you continue to work in the systems you
            know.
          </p>
          <Button
            style={{ margin: `${tokens.spacingXs} 0` }}
            isFullWidth
            onClick={this.handleSignIn}>
            Enable Lilt
          </Button>
        </div>
      );
    }

    if (reload) {
      return <p>Reload the page to initialize the Lilt App.</p>;
    }

    if (!initialized) {
      return <p />;
    }

    const lastSentAt = liltMeta.last_sent_at;
    const lastCompleted = liltMeta.last_completed_job;
    const changedSinceSent = liltMeta.changed_since_sent;

    let lastPublished = null;
    if (isPublished) {
      const lastPublishedDate = new Date(entrySys.publishedAt);
      lastPublished = lastPublishedDate;
    }

    return (
      <section>
        <LiltStatus status={liltStatus} fields={fields} isPublished={isPublished} />
        <DateLastSent lastSentAt={lastSentAt} />
        <DateLastCompleted lastCompleted={lastCompleted} />
        <DateLastPublished lastPublished={lastPublished} />
        <LocalizeButton
          status={liltStatus}
          userCanPublish={userCanPublish}
          startJob={this.handleSendForLocalization}
          cancelJob={this.cancelJob}
          completeJob={this.completeJob}
        />
        <ManageEntriesButton isVisible={showManageEntries} onClick={this.handleManageEntries} />
        <LiltCreateButton
          hasLiltCreateAccess={hasLiltCreateAccess}
          isVisible={true}
          onClick={this.handleLiltCreate}
        />
        <ContentChangedWarning isVisible={changedSinceSent} onDismiss={this.handleDismissWarning} />
        <LiltProgress
          status={liltStatus}
          availableLocales={availableLocales}
          defaultLocale={defaultLocale}
          progress={liltMeta.progress}
          userCanUpdate={userCanUpdate}
          approveLocale={this.approveLocale}
          rejectLocale={this.rejectLocale}
          updateStatus={this.updateStatus}
        />
      </section>
    );
  }
}

SidebarExtension.propTypes = {
  sdk: PropTypes.object.isRequired
};
