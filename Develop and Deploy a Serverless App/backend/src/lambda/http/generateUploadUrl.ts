import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'
import {
  generateUploadUrl,
  updateAttachmentUrl
} from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import { v4 as uuid } from 'uuid'

const logger = createLogger('generateUploadUrl')

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing generateUploadUrl event')

  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId
  const attachmentId = uuid()

  const uploadUrl = await generateUploadUrl(attachmentId)

  await updateAttachmentUrl(userId, todoId, attachmentId)

  return {
    statusCode: 202,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({ uploadUrl })
  }
}
