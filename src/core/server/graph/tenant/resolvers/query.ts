import { GQLQueryTypeResolver } from "talk-server/graph/tenant/schema/__generated__/types";

const Query: GQLQueryTypeResolver<void> = {
  asset: (source, args, ctx) => ctx.loaders.Assets.findOrCreate(args),
  comment: (source, { id }, ctx) =>
    id ? ctx.loaders.Comments.comment.load(id) : null,
  settings: (source, args, ctx) => ctx.tenant,
  me: (source, args, ctx) => ctx.user,
  discoverOIDCConfiguration: (source, { issuer }, ctx) =>
    ctx.loaders.Auth.discoverOIDCConfiguration.load(issuer),
};

export default Query;
