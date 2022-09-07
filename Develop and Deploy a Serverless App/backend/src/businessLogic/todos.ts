import 'source-map-support/register'
import { TodosAccess } from '../helpers/todosAcess'
import { TodosStorage } from '../helpers/todosStorage'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

// import { parseUserId } from '../auth/utils'
// import { AttachmentUtils } from './attachmentUtils'
import { v4 as uuid } from 'uuid'
import { createLogger } from '../utils/logger'
// import { TodoStorage } from '../helpers.bak/todoStorage'

// import * as createError from 'http-errors'
//
// TODO: Implement businessLogic
const todosAccess = new TodosAccess()
const todosStorage = new TodosStorage()

const logger = createLogger('todos')

export async function getTodos(userId: string): Promise<TodoItem[]> {
  logger.info(`getting all ToDos for user ${userId}.`)
  return await todosAccess.getTodos(userId)
}

export async function createTodo(
  userId: string,
  createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
  const todoId = uuid()
  logger.info(`creating todo ${todoId} for user ${userId}.`)

  const res: TodoItem = {
    userId: userId,
    todoId: todoId,
    attachmentUrl: null,
    createdAt: new Date().getTime.toString(),
    done: false,
    ...createTodoRequest
  }
  await todosAccess.createTodo(res)

  return res
}

// Update todo
export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<any> {
  logger.info(`Updating todo ${todoId} for ${userId}`)

  todosAccess.updateTodo(todoId, updateTodoRequest as TodoUpdate)
}

// Delete Todo
export async function deleteTodo(userId: string, todoId: string): Promise<any> {
  logger.info(`Deleting todo ${todoId} for user ${userId}`)
  todosAccess.deleteTodo(todoId)
}

export async function updateAttachmentUrl(
  userId: string,
  todoId: string,
  attachmentId: string
): Promise<any> {
  logger.info(
    `Updating attachment URL for attachment ${attachmentId} uploaded by ${userId}'s todo ${todoId}`
  )

  const attachmentUrl = await todosStorage.getAttachmentUrl(attachmentId)
  await todosAccess.updateAttachmentUrl(todoId, attachmentUrl)
}

export async function generateUploadUrl(attachmentId: string): Promise<string> {
  logger.info(`Generating upload URL for attachment ${attachmentId}`)
  const attachmentUrl = await todosStorage.getUrl(attachmentId)

  return attachmentUrl
}