import createTopLevel, { CreateParams } from "../create";

export default function create(params: CreateParams) {
  return createTopLevel({
    ...params,
    initLocalState: (localRecord, source, environment) => {
      if (params.initLocalState) {
        localRecord.setValue("COMMENTS", "activeTab");
        params.initLocalState(localRecord, source, environment);
      }
    },
  });
}
