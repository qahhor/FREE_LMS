import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Webinar } from './entities/webinar.entity';
import { WebinarParticipant } from './entities/webinar-participant.entity';

// Services
import { WebinarService } from './services/webinar.service';

// Controllers
import { WebinarController } from './controllers/webinar.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Webinar, WebinarParticipant])],
  controllers: [WebinarController],
  providers: [WebinarService],
  exports: [WebinarService],
})
export class WebinarsModule {}
