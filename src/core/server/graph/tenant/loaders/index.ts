import Context from "talk-server/graph/tenant/context";
import Assets from "./assets";
import Auth from "./auth";
import Comments from "./comments";
import Users from "./users";

export default (ctx: Context) => ({
  Auth: Auth(ctx),
  Assets: Assets(ctx),
  Comments: Comments(ctx),
  Users: Users(ctx),
});
