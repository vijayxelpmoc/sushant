type ExecutorServices =
  | 'sfCredentialService'
  | 'sfFieldService'
  | 'sfModelService'
  | 'dataProcessorService';

type ExecutorMethods =
  | 'get'
  | 'getById'
  | 'create'
  | 'update'
  | 'delete'
  | 'load';

export class ExecutorRequestDto {
  service: ExecutorServices;
  method: ExecutorMethods;
  args: Array<any>;
}
