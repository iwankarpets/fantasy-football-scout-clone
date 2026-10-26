import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElementType } from '../../database/entities/element-type.entity';
import { ElementTypesRepository } from './element-types.repository';
import { ElementTypesService } from './element-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([ElementType])],
  providers: [ElementTypesRepository, ElementTypesService],
  exports: [ElementTypesService],
})
export class ElementTypesModule {}
