import axios from 'axios';

export function liltLocale(locale) {
  if (locale === 'nb-NO') {
    locale = 'no-NO';
  }
  if (locale === 'zh-Hans') {
    locale = 'zh-CN';
  }
  if (locale === 'zh-Hant') {
    locale = 'zt';
  }
  return locale;
}

export class LiltMeta {
  /**
   * @param {Date} sentAt
   * @param {boolean} changedSinceSent
   * @param {string[]} targetLocales
   * @param {boolean} isInstantTranslation
   * @param {string} reporterEmail
   * @param {string} domain
   */
  constructor(
    progress,
    feedback,
    lastCompleted,
    sentAt,
    changedSinceSent,
    targetLocales,
    isInstantTranslation,
    reporterEmail,
    domain
  ) {
    this.progress = progress;
    this.feedback = feedback;
    this.last_completed_job = lastCompleted;
    /**
     * timestamp of the last time the user sent the
     * entry for localization
     */
    this.last_sent_at = sentAt;
    /**
     * set to true if the user changes the source content
     * after sending the content for localization
     */
    this.changed_since_sent = changedSinceSent;
    /**
     * list of target locales as specified by the user
     */
    this.target_locales = targetLocales;
    /**
     * boolean noting if the job is to be translated
     * using Instant Translation
     */
    this.is_instant_translation = isInstantTranslation;
    /**
     * email address of the contentful user who
     * submits the current entry for localization
     */
    this.reporter_email = reporterEmail;
    /**
     * the memory domain of the entry
     */
    this.domain = domain;
  }

  static initialValues() {
    const progress = {};
    const feedback = {};
    const lastCompleted = null;
    const sentAt = null;
    const changedSinceSent = false;
    const targetLocales = [];
    const isInstantTranslation = false;
    const reporterEmail = null;
    const domain = '';
    return new LiltMeta(
      progress,
      feedback,
      lastCompleted,
      sentAt,
      changedSinceSent,
      targetLocales,
      isInstantTranslation,
      reporterEmail,
      domain
    );
  }

  static fromEntry(metadata) {
    if (!metadata) {
      return LiltMeta.initialValues();
    }

    let {
      progress,
      feedback,
      changed_since_sent,
      last_completed_job,
      last_sent_at,
      target_locales,
      is_instant_translation,
      reporter_email,
      domain
    } = metadata;

    if (!progress) {
      progress = {};
    }

    if (!feedback) {
      feedback = {};
    }

    if (last_completed_job && typeof last_completed_job === 'string') {
      last_completed_job = new Date(last_completed_job);
    }

    if (last_sent_at && typeof last_sent_at === 'string') {
      last_sent_at = new Date(last_sent_at);
    }

    if (!Array.isArray(target_locales)) {
      target_locales = [];
    }

    if (!domain) {
      domain = '';
    }

    return new LiltMeta(
      progress,
      feedback,
      last_completed_job,
      last_sent_at,
      !!changed_since_sent,
      target_locales,
      !!is_instant_translation,
      reporter_email,
      domain
    );
  }
}

export class LiltClient {
  constructor(baseUrl, apiKey) {
    this.client = axios.create({
      baseURL: baseUrl,
      auth: {
        username: apiKey,
        password: apiKey
      }
    });
  }

  getMemories() {
    return this.client.get('/memories');
  }

  getConnectors() {
    return this.client.get('/connectors');
  }

  createConnector(connector) {
    return this.client.post('/connectors', connector);
  }

  updateConnector(connector) {
    return this.client.put('/connectors', connector);
  }

  createOrUpdateConnector(connector) {
    if (connector.id) {
      return this.updateConnector(connector);
    }
    return this.createConnector(connector);
  }

  deleteConnector(connectorId) {
    return this.client.delete(`/connectors?id=${connectorId}`);
  }
}
