type ExecutorServices =
  | 'sfCredentialService'
  | 'sfFieldService'
  | 'sfModelService';

type ExecutorMethods =
  | 'get'
  | 'getById'
  | 'create'
  | 'update'
  | 'delete'
  | 'load';

export interface ExecutorCall {
  service: ExecutorServices;
  method: ExecutorMethods;
  args: Array<any>;
}
