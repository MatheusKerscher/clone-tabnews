import { createRouter } from "next-connect";

import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandler);

async function patchHandler(req, res) {
  const activationTokenId = req.query.token_id;

  const validActivationToken = await activation.findOneValidById(activationTokenId)
  const usedActivationToken = await activation.markTokenAsUsed(validActivationToken)

  await activation.activateUserByUserId(usedActivationToken.user_id)

  res.status(200).json(usedActivationToken);
}
