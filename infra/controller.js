import * as cookie from "cookie";

import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";
import session from "models/session";

async function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function onErrorHandler(error, req, res) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UnauthorizedError
  ) {
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

function disableCacheControl(res) {
  res.setHeader("Cache-Control", "no-store,no-cache,max-age=0,must-revalidate");
}

const controller = {
  errorHandler: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  createSessionCookie,
  disableCacheControl,
};

export default controller;
