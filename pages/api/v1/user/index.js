import { createRouter } from "next-connect";

import controller from "infra/controller";
import session from "models/session";
import user from "models/user";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandler);

async function getHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const sessionFound = await session.findOneValidByToken(sessionToken);
  const renewedSession = await session.renew(sessionFound.id);
  const userFound = await user.findOneById(sessionFound.user_id);

  controller.createSessionCookie(renewedSession.token, res);
  controller.disableCacheControl(res);

  const userTryingToGet = req.context.user;
  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user:self",
    userFound,
  );

  res.status(200).json(secureOutputValues);
}
