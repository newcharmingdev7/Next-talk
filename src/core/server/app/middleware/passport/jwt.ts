import jwt, { SignOptions } from "jsonwebtoken";
import uuid from "uuid";

import { Config } from "talk-server/config";
import { User } from "talk-server/models/user";
import { Request } from "talk-server/types/express";

const authHeaderRegex = /(\S+)\s+(\S+)/;

export function parseAuthHeader(header: string) {
  const matches = header.match(authHeaderRegex);
  if (!matches || matches.length < 3) {
    return null;
  }

  return {
    scheme: matches[1].toLowerCase(),
    value: matches[2],
  };
}

export function extractJWTFromRequest(req: Request) {
  const header = req.get("authorization");
  if (header) {
    const parts = parseAuthHeader(header);
    if (parts && parts.scheme === "bearer") {
      return parts.value;
    }
  }

  const token: string | undefined | false = req.query && req.query.access_token;
  if (token) {
    return token;
  }

  return null;
}

export enum AsymmetricSigningAlgorithm {
  RS256 = "RS256",
  RS384 = "RS384",
  RS512 = "RS512",
  ES256 = "ES256",
  ES384 = "ES384",
  ES512 = "ES512",
}

export enum SymmetricSigningAlgorithm {
  HS256 = "HS256",
  HS384 = "HS384",
  HS512 = "HS512",
}

export type JWTSigningAlgorithm =
  | AsymmetricSigningAlgorithm
  | SymmetricSigningAlgorithm;

export interface JWTSigningConfig {
  secret: Buffer;
  algorithm: JWTSigningAlgorithm;
}

export function createAsymmetricSigningConfig(
  algorithm: AsymmetricSigningAlgorithm,
  secret: string
): JWTSigningConfig {
  return {
    // Secrets have their newlines encoded with newline litterals.
    secret: Buffer.from(secret.replace(/\\n/g, "\n")),
    algorithm,
  };
}

export function createSymmetricSigningConfig(
  algorithm: SymmetricSigningAlgorithm,
  secret: string
): JWTSigningConfig {
  return {
    secret: new Buffer(secret),
    algorithm,
  };
}

function isSymmetricSigningAlgorithm(
  algorithm: string | SymmetricSigningAlgorithm
): algorithm is SymmetricSigningAlgorithm {
  return algorithm in SymmetricSigningAlgorithm;
}

function isAsymmetricSigningAlgorithm(
  algorithm: string | AsymmetricSigningAlgorithm
): algorithm is AsymmetricSigningAlgorithm {
  return algorithm in AsymmetricSigningAlgorithm;
}

/**
 * Parses the config and provides the signing config.
 *
 * @param config the server configuration
 */
export function createJWTSigningConfig(config: Config): JWTSigningConfig {
  const secret = config.get("signing_secret");
  const algorithm = config.get("signing_algorithm");
  if (isSymmetricSigningAlgorithm(algorithm)) {
    return createSymmetricSigningConfig(algorithm, secret);
  } else if (isAsymmetricSigningAlgorithm(algorithm)) {
    return createAsymmetricSigningConfig(algorithm, secret);
  }

  // TODO: (wyattjoh) return better error.
  throw new Error("invalid algorithm specified");
}

export type SigningTokenOptions = Pick<SignOptions, "audience" | "issuer">;

export async function signTokenString(
  { algorithm, secret }: JWTSigningConfig,
  user: User,
  options: SigningTokenOptions
) {
  return jwt.sign({}, secret, {
    ...options,
    jwtid: uuid.v4(),
    algorithm,
    expiresIn: "1 day", // TODO: (wyattjoh) evaluate allowing configuration?
    subject: user.id,
  });
}
