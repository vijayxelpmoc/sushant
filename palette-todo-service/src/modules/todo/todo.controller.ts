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
  UseInterceptors,
  CacheInterceptor,
  InternalServerErrorException,
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
import { CreateTodo, SFTodo } from './types';
import { randomUUID } from 'crypto';
import { SfService } from '@gowebknot/palette-salesforce-service';

@Controller({
  path: 'todo',
  // version: '1',
})
export class TodoController {
  constructor(
    private readonly todoService: TodoService,
    private sfService: SfService,
  ) {}
  /**
   * function to create todo from events
   *@param EventTodoDto contains eventId and listedBy
   * return status code and errors
   */

   // activites
  // @hasRoles(Role.Student)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiBearerAuth()
  // @ApiResponse({
  //   status: 200,
  //   description: 'Fetch all todos assigned to the logged in user',
  // })
  // @ApiBody({ type: EventTodoDto })
  // @Post('event')
  // async createTodoFromEvent(
  //   @Body() eventTodoDto: EventTodoDto,
  //   @Body('instituteId') instituteId: string,
  //   @Request() req,
  // ) {
  //   return await this.todoService.createTodoWithEvent(
  //     req.user.id,
  //     eventTodoDto,
  //     instituteId,
  //   );
  // }

  // reviewed
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/:instituteId') //1
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Returns list of todos.',
    // type: getTodosResponseBodyDto,
    isArray: true,
  })
  async getTodos(@Request() req, @Param('instituteId') instituteId: string) {
    // console.log(instituteId);
    
    return await this.todoService.getTodos(
      req.user.id,
      instituteId,
    );
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
    type: CreateTodoV2Dto,
  })
  @ApiResponse({
    status: 200,
    description: 'Adds a discrete or global todo draft',
    type: CreateTodoV2Dto,
  })
  @Post('draft') //5
  async createTodoDraft(
    @Body() createTodoDto: CreateTodoV2Dto,
    @Body('instituteId') instituteId: string,

    @Request() req,
  ) {
    // error
    return await this.todoService.createDraftToDo(
      createTodoDto,
      req.user.id,
      req.user.RecordTypeName,
      instituteId,
    );
  }


  // reviewed
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
  @Post('requested/accept/:id') //7
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
  async acceptRequestedTodo(
    @Request() req,
    @Param('id') id,
    @Body('instituteId') instituteId: string,
  ) {
    return await this.todoService.acceptOrRejectRequestedTodo(
      req.user.id,
      id,
      'Approved',
      instituteId,
    );
  }

  // reviewed
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
  @Post('requested/reject/:id') //8
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
  async rejectRequestedTodo(
    @Request() req,
    @Param('id') id,
    @Body('instituteId') instituteId: string,
  ) {
    return await this.todoService.acceptOrRejectRequestedTodo(
      req.user.id,
      id,
      'Rejected',
      instituteId,
    );
  }


  // reviewed
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/:instituteId/:id') //3
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Fetch a single todo',
  })
  async getTodo(
    @Request() req,
    @Param('instituteId') instituteId: string,
    @Param('id') id: string,
  ) {
    console.log(req.user);
    
    return await this.todoService.getTodo(req.user.id, id, instituteId);
  }


  // reviewed
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
  @Post('requested/bulk/accept') //9
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Accept requested todos.',
  })
  async acceptRequestedTodoBulk(
    @Request() req,
    @Body('todoIds') todoIds: string[],
    @Body('instituteId') instituteId: string,
  ) {
    return await this.todoService.acceptOrRejectRequestedTodoBulk(
      req.user.id,
      todoIds,
      'Accepted',
      instituteId,
    );
  }


  // reviewed
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
    @Body('instituteId') instituteId: string,
  ) {    
    console.log(instituteId);
    
    return await this.todoService.updateToDoStatus(
      req.user.id,
      id,
      status,
      req.user.RecordTypeName,
      instituteId,
      note,
    );
  }


  // reviewed
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
  @Post('requested/bulk/reject') //10
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Reject requested todos in bulk.',
  })
  async rejectRequestedTodoBulk(
    @Request() req,
    @Body('todoIds') todoIds: string[],
    @Body('instituteId') instituteId: string,
  ) {
    return await this.todoService.acceptOrRejectRequestedTodoBulk(
      req.user.id,
      todoIds,
      'Rejected',
      instituteId,
    );
  }


  // reviewed
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
  @Get('/:instituteId/recepients/get') //11
  @ApiBearerAuth()
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Gets Todo recipients',
    type: AssigneeInfoDtoV2,
    isArray: true,
  })
  async getTodoRecepients(
    @Request() req,
    @Param('instituteId') instituteId: string
  ) {   
    console.log(req.user);
    
    return await this.todoService.getTodoRecepients(
      req.user.id,
      req.user.recordTypeName,
      instituteId,
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
  @Post('todoresources') // route
  async createTodoResources(
    @Body() createTodoResourcesDto: CreateTodoResourcesDto,
    @Request() req,
    @Body('instituteId') instituteId: string,
  ) {
    return await this.todoService.createTodoResources(
      createTodoResourcesDto,
      req.user.id,
      true, // isNewTodo - True
      instituteId,
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
  @Delete('/deleteAll')
  async deleteAllTodos(
    @Request() req,
    @Body('instituteId') instituteId: string,
  ) {
    return this.todoService.deleteAllTodos(
      req.user.id,
      req.user.RecordTypeName,
      instituteId,
    );
  }

  /**
   * function to update the todo
   * @param updateTodoDto
   * fields with values that has to be updated
   */
  @hasRoles(Role.Student, Role.Parent, Role.Advisor, Role.Faculty)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/update/todo/:id') //12
  @ApiOkResponse({ description: 'Todo Updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: UpdateTodoDto })
  async updateTodo(
    @Body('updatedTodo') updateTodoDto: UpdateTodoDto,
    @Param() params,
    @Request() req,
    @Body('instituteId') instituteId: string,
  ) {
    return await this.todoService.updateTodo(
      updateTodoDto,
      req.user.id,
      params.id,
      instituteId,
    );
  }


  // reviewed
  @hasRoles(Role.Student)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOkResponse({ description: 'Todo Updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: BulkUpdateTodoStatusDto })
  @Patch('update/bulk/status') //13
  bulkUpdate(
    @Request() req,
    @Body('todoIds') todoIds: string[],
    @Body('status') status: string,
    @Body('instituteId') instituteId: string,
  ) {
    return this.todoService.updateTodoStatusBulk(
      req.user.id,
      todoIds,
      status,
      req.user.RecordTypeName,
      instituteId,
    );
  }

  /*
   * Create a Todo.
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
  @ApiResponse({
    status: 200,
    description: 'Adds a discrete or global todo',
    type: CreateTodoResponse,
  })
  @Post('/create') //4 // not
  async createTodo(
    @Body('todo') createTodoDto: CreateTodoV2Dto,
    @Body('instituteId') instituteId: string,
    @Request() req,
  ) {
    console.log(req.user);
    
    return await this.todoService.createTodoV2(
      createTodoDto,
      req.user.id,
      req.user.RecordTypeName,
      instituteId,
    );
  }


  // reviewed
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/:instituteId/requested/pending') //6
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Get all requested todos.',
  })
  async getRequestedTodos(
    @Request() req,
    @Param('instituteId') instituteId: string,
  ) {
    return await this.todoService.getRequestedTodosV2(req.user.id, instituteId);
  }

  // reviewed
  @UseInterceptors(CacheInterceptor)
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Observer,
    Role.Administrator,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/:instituteId/task/:studentid') //2
  async getToDo(
    @Param('studentid') studentid: string,
    @Param('instituteId') instituteId: string,
  ) {
    const response = await this.todoService.getThirdPartyTodosV2(
      studentid,
      'Student',
      instituteId,
    );
    return response;
  }
}
