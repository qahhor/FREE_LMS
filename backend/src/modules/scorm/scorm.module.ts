import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { ScormPackage } from './entities/scorm-package.entity';
import { ScormTracking } from './entities/scorm-tracking.entity';

// Services
import { ScormService } from './services/scorm.service';

// Controllers
import { ScormController } from './controllers/scorm.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ScormPackage, ScormTracking])],
  controllers: [ScormController],
  providers: [ScormService],
  exports: [ScormService],
})
export class ScormModule {}
