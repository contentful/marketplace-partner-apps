export const replaceChannel = (input: string, replacement: string) =>
  /* eslint-disable-next-line no-template-curly-in-string*/ input.replace(
    "${channel}",
    replacement
  );

export const replaceApplication = (input: string, replacement: string) =>
  /* eslint-disable-next-line no-template-curly-in-string*/ input.replace(
    "${application}",
    replacement
  );

export const replaceChannelAndApplication = (
  input: string,
  { application, channel }: { application: string; channel: string }
) => replaceApplication(replaceChannel(input, channel), application);
