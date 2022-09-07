import 'source-map-support/register'

import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWSXRay from 'aws-xray-sdk'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'

const logger = createLogger('TodosAccess')

const XAWS = AWSXRAY.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

// TODO: Implement the dataLayer logic
export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly TodosByUserIndex = process.env.TODOS_BY_USER_INDEX
  ) {}

  async getTodos(userId: string): Promise<TodoItem[]> {
    logger.info(`Getting all toDos for user ${userId} from ${this.todosTable}`)

    const res = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.TodosByUserIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()
    return res.Items as TodoItem[]
  }

  // Create Todo
  async createTodo(todoItem: TodoItem): Promise<string> {
    logger.info(`Creating todo ${todoItem.todoId}`)

    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem
      })
      .promise()
    return 'success'
  }
  // Update Todo
  async updateTodo(todoId: string, todoUpdate: TodoUpdate): Promise<string> {
    logger.info(`Processing todo: ${todoId}`)

    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId: todoId
        },
        UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': todoUpdate['name'],
          ':dueDate': todoUpdate['dueDate'],
          ':done': todoUpdate['done']
        }
      })
      .promise()
    return 'success'
  }
  // Delete Todo
  async deleteTodo(todoId: string): Promise<string> {
    logger.info(`Deleting todo: ${todoId}`)
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          todoId: todoId
        }
      })
      .promise()
    return 'success'
  }
  // Update attachment URL
  async updateAttachmentUrl(
    todoId: string,
    attachmentUrl: string
  ): Promise<string> {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId: todoId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      })
      .promise()
    return 'success'
  }
}
