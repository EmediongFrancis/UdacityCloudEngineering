import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')
// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-0dvsmf-m.us.auth0.com/.well-known/jwks.json'

async function getCertificate(): Promise<string> {
  logger.info(`Fetching certificate from ${jwksUrl}`)

  const res = await Axios.get(jwksUrl)
  const keys = res.data.keys

  const filteredKeys = keys.filter(
    (key: {
      use: string
      kty: string
      alg: string
      n: any
      e: any
      kid: any
      x5c: string | any[]
    }) =>
      key.use === 'sig' &&
      key.kty === 'RSA' &&
      key.alg === 'RS256' &&
      key.n &&
      key.e &&
      key.kid &&
      key.x5c &&
      key.x5c.length
  )

  const key = filteredKeys[0]
  const publicKey = key.x5c[0]

  // Convert pubkey to PEM
  const cert = publicKey.match(/.{1,64}/g).join('\n')
  const pem = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`

  return pem
}

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('Auth successful')

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (error) {
    logger.error('You are not allowed to perform this action', {
      error: error.message
    })
    // revoke auth if failed
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)

  const cert = await getCertificate()

  logger.info(`Verifying token ${token}`)

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}