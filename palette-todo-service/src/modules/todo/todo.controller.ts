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
  Query,
} from '@nestjs/common';
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
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Administrator,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async getTodos(
    @Request() req,
    @Query('instituteId') instituteId: string,
    @Query('programId') programId: string,
  ) {
    console.log(programId);

    return await this.todoService.getTodosV2(
      req.user.id,
      req.user.recordTypeName,
      programId,
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
  @Post('draft')
  async createTodoDraft(
    @Body() createTodoDto: CreateTodoV2Dto,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
    @Request() req,
  ) {
    // error
    return await this.todoService.createDraftToDo(
      createTodoDto,
      req.user.id,
      req.user.recordTypeName,
      programId,
      instituteId,
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
  async acceptRequestedTodo(
    @Request() req,
    @Param('id') id: string,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return await this.todoService.acceptOrRejectRequestedTodo(
      req.user.id,
      id,
      'Accepted',
      programId,
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
  async rejectRequestedTodo(
    @Request() req,
    @Param('id') id,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return await this.todoService.acceptOrRejectRequestedTodo(
      req.user.id,
      id,
      'Rejected',
      programId,
      instituteId,
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
  @Get('detail/:id')
  async getTodo(
    @Request() req,
    @Param('id') id: string,
    @Query('instituteId') instituteId: string,
    @Query('programId') programId: string,
  ) {
    return await this.todoService.getTodoV2(
      req.user.id,
      id,
      programId,
      instituteId,
    );
  }

  /*
   * Bulk Accept Todo
   */
  // test
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('requested/bulk/accept')
  async acceptRequestedTodoBulk(
    @Request() req,
    @Body('todoIds') todoIds: string[],
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    console.log(programId);
    return await this.todoService.acceptOrRejectRequestedTodoBulk(
      req.user.id,
      todoIds,
      'Accepted',
      programId,
      instituteId,
    );
  }

  // test
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
  async updateTodoStatus(
    @Request() req,
    @Param('id') id,
    @Body('status') status,
    @Body('note') note,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    console.log(instituteId, programId, status, id);

    return await this.todoService.updateToDoStatus(
      req.user.id,
      id,
      status,
      req.user.recordTypeName,
      instituteId,
      programId,
      note,
    );
  }

  // test
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
  async rejectRequestedTodoBulk(
    @Request() req,
    @Body('todoIds') todoIds: string[],
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return await this.todoService.acceptOrRejectRequestedTodoBulk(
      req.user.id,
      todoIds,
      'Rejected',
      programId,
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
  @Get('/recepients/get') //11
  async getTodoRecepients(
    @Request() req,
    @Query('instituteId') instituteId: string,
    @Query('programId') programId: string,
  ) {
    // console.log(req.user);

    return await this.todoService.getTodoRecepients(
      req.user.id,
      req.user.recordTypeName,
      instituteId,
      programId,
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
  @Post('todoresources') // route
  async createTodoResources(
    @Body() createTodoResourcesDto: CreateTodoResourcesDto,
    @Request() req,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return await this.todoService.createTodoResources(
      createTodoResourcesDto,
      req.user.id,
      true, // isNewTodo - True
      programId,
      instituteId,
    );
  }

  // doubt
  /**
   * function to update the todo
   * @param todoID
   * fields with values that has to be updated
   */
  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Administrator,
    Role.Faculty,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/deleteAll')
  async deleteAllTodos(
    @Request() req,
    @Query('instituteId') instituteId: string,
    @Query('programId') programId: string,
  ) {
    return this.todoService.deleteAllTodos(
      req.user.id,
      req.user.recordTypeName,
      programId,
      instituteId,
    );
  }

  // test
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
  @Patch('/update/todo')
  async updateTodo(
    @Body('updatedTodo') updateTodoDto: UpdateTodoDto,
    @Request() req,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return await this.todoService.updateTodo(
      updateTodoDto,
      req.user.id,
      req.user.recordTypeName,
      instituteId,
      programId,
    );
  }

  // test
  @hasRoles(
    Role.Student,
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('update/bulk/status') //13
  async bulkUpdate(
    @Request() req,
    @Body('todoIds') todoIds: string[],
    @Body('status') status: string,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return await this.todoService.updateTodoStatusBulk(
      req.user.id,
      todoIds,
      status,
      req.user.recordTypeName,
      instituteId,
      programId,
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
  @Post('/create') //4 // not
  async createTodo(
    @Body() createTodoDto: CreateTodoV2Dto,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
    @Request() req,
  ) {
    // console.log(req.user);

    return await this.todoService.createTodoV2(
      createTodoDto,
      req.user.id,
      req.user.recordTypeName,
      programId,
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
  @Get('/requested/pending') //6
  async getRequestedTodos(
    @Request() req,
    @Query('instituteId') instituteId: string,
    @Query('programId') programId: string,
  ) {
    console.log(req.user);

    return await this.todoService.getRequestedTodosV2(
      req.user.id,
      programId,
      instituteId,
    );
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
  @Get('/task/:studentid') //2
  async getToDo(
    @Param('studentid') studentid: string,
    @Query('instituteId') instituteId: string,
    @Query('programId') programId: string,
  ) {
    const response = await this.todoService.getThirdPartyTodosV2(
      studentid,
      'Student',
      instituteId,
      programId,
    );
    return response;
  }

  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/publish/draft')
  async publishDraftTodo(
    @Request() req,
    @Body('Id') Id: string,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    return await this.todoService.publishDraftTodo(Id, programId, instituteId);
  }

  @hasRoles(
    Role.Student,
    Role.Parent,
    Role.Advisor,
    Role.Faculty,
    Role.Administrator,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/publish/bulk')
  async publishDraftMltipleTodos(
    @Body('ids') ids,
    @Body('instituteId') instituteId: string,
    @Body('programId') programId: string,
  ) {
    // console.log(req);

    return await this.todoService.publishDraftMultipleTodos(
      ids,
      programId,
      instituteId,
    );
  }
}
