import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Get,
  Delete,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Role,
  hasRoles,
  JwtAuthGuard,
  RolesGuard,
} from '@gowebknot/palette-wrapper';
import {
  AssigneeInfoDto,
  CreateTodoDto,
  CreateTodoResponse,
  CreateTodoResourcesDto,
  UpdateTodoDto,
  BulkUpdateTodoStatusDto,
  UpdateTaskStatusDto,
  EventTodoDto,
} from './dtos';

import { TodoService } from './todo.service';
import { Errors } from '@src/constants';

@Controller({
  path: 'todo',
  version: '1',
})
export class TodoController {
  constructor(private readonly todoService: TodoService) {}
  /**
   * function to create todo from events
   *@param EventTodoDto contains eventId and listedBy
   * return status code and errors
   */
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Fetch all todos assigned to the logged in user',
  })
  @ApiBody({ type: EventTodoDto })
  @Post('event')
  async createTodoFromEvent(
    @Body() eventTodoDto: EventTodoDto,
    @Request() req,
  ) {
    return await this.todoService.createTodoWithEvent(
      req.user.id,
      eventTodoDto,
    );
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Fetch all todos assigned to the logged in user',
  })
  async getTodos(@Request() req) {
    return await this.todoService.getTodos(req.user.id);
  }

  /*
   * Create a new discrete or global Todo draft
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiBody({
    type: CreateTodoDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Adds a discrete or global todo draft',
    type: CreateTodoResponse,
  })
  @Post('draft')
  async createTodoDraft(@Body() createTodoDto: CreateTodoDto, @Request() req) {
    return await this.todoService.createDraftToDo(
      createTodoDto,
      req.user.id,
      req.user.RecordTypeName,
    );
  }

  /*
   * Accept a Todo Request
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('requested/accept/:id')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    required: true,
    description: 'todo id',
    schema: { type: 'string' },
  })
  @ApiResponse({
    status: 200,
    description: 'Accepted requested todo with ID.',
  })
  async acceptRequestedTodo(@Request() req, @Param('id') id) {
    return await this.todoService.acceptOrRejectRequestedTodo(
      req.user.id,
      id,
      'Accepted',
    );
  }

  /*
   * Reject a Todo Request
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('requested/reject/:id')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    required: true,
    description: 'todo id',
    schema: { type: 'string' },
  })
  @ApiResponse({
    status: 200,
    description: 'Rejects requested todo with ID.',
  })
  async rejectRequestedTodo(@Request() req, @Param('id') id) {
    return await this.todoService.acceptOrRejectRequestedTodo(
      req.user.id,
      id,
      'Rejected',
    );
  }

  @Get('/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Fetch a single todo',
  })
  async getTodo(@Request() req, @Param('id') id: string) {
    return await this.todoService.getTodo(req.user.id, id);
  }

  /*
   * Bulk Accept Todo
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('requested/bulk/accept')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      properties: {
        todoIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Accepts requested todos.',
  })
  async acceptRequestedTodoBulk(
    @Request() req,
    @Body('todoIds') todoIds: string[],
  ) {
    return await this.todoService.acceptOrRejectRequestedTodoBulk(
      req.user.id,
      todoIds,
      'Accepted',
    );
  }

  @Post('/update/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Fetch a single todo',
  })
  @ApiBody({ type: UpdateTaskStatusDto })
  async updateToDoStatus(
    @Request() req,
    @Param('id') id,
    @Body('status') status,
  ) {
    return await this.todoService.updateToDoStatus(req.user.id, id, status);
  }

  /*
   * Bulk Reject Todo
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('requested/bulk/reject')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      properties: {
        todoIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Rejects requested todos.',
  })
  async rejectRequestedTodoBulk(
    @Request() req,
    @Body('todoIds') todoIds: string[],
  ) {
    return await this.todoService.acceptOrRejectRequestedTodoBulk(
      req.user.id,
      todoIds,
      'Rejected',
    );
  }

  /*
   * Get Todo Recepient List
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('recepients')
  @ApiBearerAuth()
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Gets Todo recipients',
    type: AssigneeInfoDto,
    isArray: true,
  })
  async getTodoRecepients(@Request() req) {
    return await this.todoService.getTodoRecepients(
      req.user.id,
      req.user.RecordTypeName,
    );
  }

  /**
   * function to create todo resources and connect them to the todo.
   * ONLY TO BE USED TO CONNECT RESOURCES WITH NEW TODO
   * @param createTodoResourcesDto contains todoId and the resources to be created
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiBody({ type: CreateTodoResourcesDto })
  @ApiResponse({
    status: 200,
    description: 'Creates todo resources and connects them to todos.',
  })
  @Post('add/resources')
  async createTodoResources(
    @Body() createTodoResourcesDto: CreateTodoResourcesDto,
    @Request() req,
  ) {
    return await this.todoService.createTodoResources(
      createTodoResourcesDto,
      req.user.id,
      true, // isNewTodo - True
    );
  }

  /**
   * function to update the todo
   * @param todoID
   * fields with values that has to be updated
   */
  @hasRoles(Role.Student, Role.Parent, Role.Advisor, Role.Faculty)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Todo Deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Delete('/delete/:id')
  async deleteTodo(@Param() params) {
    return await this.todoService.deleteTodo(params.id);
  }

  /**
   * function to update the todo
   * @param updateTodoDto
   * fields with values that has to be updated
   */
  @hasRoles(Role.Student, Role.Parent, Role.Advisor, Role.Faculty)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/update/:id')
  @ApiOkResponse({ description: 'Todo Updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: UpdateTodoDto })
  async updateTodo(
    @Body() updateTodoDto: UpdateTodoDto,
    @Param() params,
    @Request() req,
  ) {
    return await this.todoService.updateTodo(
      updateTodoDto,
      req.user.id,
      params.id,
    );
  }

  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOkResponse({ description: 'Todo Updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: BulkUpdateTodoStatusDto })
  @Patch('bulk/status/update')
  bulkUpdate(
    @Request() req,
    @Body()
    bulkUpdateTodoStatusDto: BulkUpdateTodoStatusDto,
  ) {
    return this.todoService.bulkUpdateStatus('', bulkUpdateTodoStatusDto);
  }
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('/bulk/status/update')
  async updateTodoStatusBulk(
    @Request() req,
    @Body('todoIds') todoIds: string[],
    @Body('status') status: string,
  ) {
    return await this.todoService.updateTodoStatusBulk(
      req.user.id,
      todoIds,
      status,
    );
  }

  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/todo')
  async createTodo(@Body() createTodoDto: CreateTodoDto, @Request() req) {
    const id: string = req.user.id;
    const recordType: Role = req.user.RecordTypeName;
    let todo: CreateTodoDto;
    if (!createTodoDto.assignee) {
      throw new BadRequestException(Errors.ASSIGNEE_EMPTY);
    }
    // TODO :- Enabled after enabling valid assignee service
    // if (
    //   !(await this.todoService.isValidAssignee(todo.assignee, id, recordType))
    // ) {
    //   throw new BadRequestException(Errors.ASSIGNEE_INVALID);
    // }
    switch (recordType) {
      case Role.Student: {
        todo = {
          ...createTodoDto,
          assignee: [id],
          listedBy: id,
        };
        break;
      }
      case Role.Parent:
      case Role.Advisor:
      case Role.Faculty:
      case Role.Administrator: {
        todo = {
          ...createTodoDto,
          listedBy: id,
        };
      }
    }

    return await this.todoService.createTodo(todo);
  }
}
