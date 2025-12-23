import * as cookie from "cookie";

import {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";
import session from "models/session";
import user from "models/user";

async function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function onErrorHandler(error, req, res) {
  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ForbiddenError) {
    return res.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(res);
    return res.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);

  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function createSessionCookie(sessionToken, res) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    httpOnly: true,
    maxAge: session.EXPIRES_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
  });

  res.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(res) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    httpOnly: true,
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
  });

  res.setHeader("Set-Cookie", setCookie);
}

function disableCacheControl(res) {
  res.setHeader("Cache-Control", "no-store,no-cache,max-age=0,must-revalidate");
}

async function injectAnonymousOrUser(req, res, next) {
  if (req.cookies?.session_id) {
    await injectAuthenticatedUser(req)
  } else {
    injectAnonymousUser(req)
  }

  return next()
}

async function injectAuthenticatedUser(req) {
  const sessionToken = req.cookies.session_id;
  const sessionFound = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionFound.user_id)

  req.context = {
    ...req.context,
    user: userObject
  }
}

function injectAnonymousUser(req) {
  const anonymousUserObject = {
    features: ["read:activation_token", "create:session", "create:user"]
  }

  req.context = {
    ...req.context,
    user: anonymousUserObject
  }
}

function canRequest(feature) {
  return function canRequestMiddleware(req, res, next) {
    const userTryingToRequest = req.context.user
    if (userTryingToRequest.features.includes(feature)) {
      return next()
    }

    throw new ForbiddenError({
      message: "Você não possui permissão para executar essa ação.",
      action: `Verifique se o seu usuário tem a autorização ${feature}.`
    })
  }
}

const controller = {
  errorHandler: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  createSessionCookie,
  clearSessionCookie,
  disableCacheControl,
  injectAnonymousOrUser,
  canRequest
};

export default controller;
