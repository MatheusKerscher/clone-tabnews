import { createRouter } from "next-connect";

import controller from "infra/controller";
import user from "models/user";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser)
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandler);

async function getHandler(req, res) {
  const username = req.query.username;
  const userFound = await user.findOneByUsername(username);

  res.status(200).json(userFound);
}

async function patchHandler(req, res) {
  const username = req.query.username;
  const userInputValues = req.body;

  const userTryingToPatch = req.context.user
  const targetUser = await user.findOneByUsername(username)

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário.",
      action: "Verifique se você possui a feature necessária para atualizar outro usuário.",
    })
  }

  const updatedUser = await user.update(username, userInputValues);

  res.status(200).json(updatedUser);
}
