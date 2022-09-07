import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosStorage')
// TODO: Implement the file storage logic
export class TodosStorage {
  constructor(
    private readonly s3Client = new XAWS.S3({ signatureVersion: 'v4' }), // should I use AWS instead???
    private readonly attachmentsS3Bucket = process.env.ATTACHMENTS_S3_BUCKET,
    private readonly signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async getAttachmentUrl(attachmentId: string): Promise<string> {
    logger.info(`Getting attachment URL for ${attachmentId}`)
    const attachmentUrl = `https://${this.attachmentsS3Bucket}.s3.amazonaws.com/${attachmentId}`
    return attachmentUrl
  }

  // generate upload uri
  async getUrl(attachmentId: string): Promise<string> {
    logger.info(`Creating attachment ${attachmentId}`)
    const uri = this.s3Client.getSignedUrl('putObject', {
      Bucket: this.attachmentsS3Bucket,
      Key: attachmentId,
      Expires: parseInt(this.signedUrlExpiration) || 1000 // default to 1000 if empty
    })
    return uri
  }
}
