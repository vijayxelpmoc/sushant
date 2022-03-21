import { PartialType } from '@nestjs/mapped-types';
import { ObserverDto } from './observer.dto';

export class UpdateObserverDto extends PartialType(ObserverDto) {}
