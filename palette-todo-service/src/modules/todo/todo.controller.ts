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
  CreateTodoV2Dto,
  AssigneeInfoDtoV2,
} from './dtos';

import { TodoService } from './todo.service';
import { Errors } from '@src/constants';
import { CreateTodo } from './types';

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

  // done
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

  // done
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Returns list of todos.',
    // type: getTodosResponseBodyDto,
    isArray: true,
  })
  async getTodos(@Request() req) {
    return await this.todoService.getTodos(req.user.id);
  }

  // done
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
    type: CreateTodoV2Dto,
  })
  @ApiResponse({
    status: 200,
    description: 'Adds a discrete or global todo draft',
    type: CreateTodoV2Dto,
  })
  @Post('draft')
  async createTodoDraft(
    @Body() createTodoDto: CreateTodoV2Dto,
    @Request() req,
  ) {
    return await this.todoService.createDraftToDo(
      createTodoDto,
      req.user.id,
      req.user.RecordTypeName,
    );
  }

  // done
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

  // done
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

  // done
  @Get('/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Fetch a single todo',
  })
  async getTodo(@Request() req, @Param('id') id: string) {
    return await this.todoService.getTodo(req.user.id, id);
  }

  // done
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
  @Post('todo/requested/bulk/accept')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Accept requested todos.',
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

  // done
  /**
   * function to update the todo
   * @param updateTodoDto
   * fields with values that has to be updated
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/update/status/:id')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Updates a Todo',
  })
  async updateTodoStatus(
    @Request() req,
    @Param('id') id,
    @Body('status') status,
    @Body('note') note,
  ) {
    return await this.todoService.updateToDoStatus(
      req.user.id,
      id,
      status,
      req.user.RecordTypeName,
      note,
    );
  }

  // done
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
  @Post('todo/requested/bulk/reject')
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Reject requested todos in bulk.',
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


  // done
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
    type: AssigneeInfoDtoV2,
    isArray: true,
  })
  async getTodoRecepients(@Request() req) {
    return await this.todoService.getTodoRecepients(
      req.user.id,
      req.user.RecordTypeName,
    );
  }


  // done
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
  @Post('todoresources') // route
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

  // doubt
  /**
   * function to update the todo
   * @param todoID
   * fields with values that has to be updated
   */
  @hasRoles(Role.Student, Role.Parent, Role.Advisor, Role.Faculty)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Todo Deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/todo/deleteAll')
  async deleteAllTodos(@Request() req) {
    return this.todoService.deleteAllTodos(
      req.user.id,
      req.user.RecordTypeName,
    );
  }

  // done
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

  // done
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOkResponse({ description: 'Todo Updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: BulkUpdateTodoStatusDto })
  @Patch('bulk/status/update')
  bulkUpdate(
    @Request() req,
    @Body('todoIds') todoIds: string[],
    @Body('status') status: string,
  ) {
    return this.todoService.updateTodoStatusBulk(
      req.user.id,
      todoIds,
      status,
      req.user.RecordTypeName,
    );
  }

  // done
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/todo')
    @ApiResponse({
      status: 200,
      description: 'Creates a todo',
      type: CreateTodoResponse,
    })
    async createTodo(@Body() createTodoDto: CreateTodoV2Dto, @Request() req) {
      const id: string = req.user.id;
      const recordType: Role = req.user.RecordTypeName;
  
      let todo: CreateTodoV2Dto;
  
      switch (recordType) {
        case Role.Student: {
          todo = {
            ...createTodoDto,
            assignee: [id],
            listedBy: id,
          };
          break;
        }
        case Role.Parent: {
          if (!createTodoDto.assignee) {
            throw new BadRequestException('Assignee not provided');
          }
  
          todo = {
            ...createTodoDto,
            listedBy: id,
          };
        }
        case Role.Advisor: {
          if (!createTodoDto.assignee) {
            throw new BadRequestException('Assignee not provided');
          }
  
          todo = {
            ...createTodoDto,
            listedBy: id,
          };
        }
        case Role.Faculty: {
          if (!createTodoDto.assignee) {
            throw new BadRequestException('Assignee not provided');
          }
  
          todo = {
            ...createTodoDto,
            listedBy: id,
          };
        }
        case Role.Administrator: {
          if (!createTodoDto.assignee) {
            throw new BadRequestException('Assignee not provided');
          }
  
          todo = {
            ...createTodoDto,
            listedBy: id,
          };
        }
      }
  
      if (
        !(await this.todoService.isValidAssignee(
          todo.assignee,
          id,
          recordType,
        ))
      ) {
        throw new BadRequestException('Not a valid assignee');
      }
  
      const response = await this.todoService.createTodo(todo);
  
      return {
        status: 201,
        message: 'Todo Created',
        data: response,
      };
    }
}
