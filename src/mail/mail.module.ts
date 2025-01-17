import { Global, Module } from '@nestjs/common';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [
    RabbitmqModule,
    // MailerModule.forRootAsync({
    //   useFactory: async (configService: ConfigService) => ({
    //     transport: {
    //       service: 'Gmail',
    //       host: configService.get('MAIL_HOST'),
    //       port: configService.get('MAIL_PORT'),
    //       secure: false,
    //       auth: {
    //         user: configService.get('MAIL_USER'),
    //         pass: configService.get('MAIL_PASS'),
    //       },
    //     },
    //     defaults: {
    //       headers: {
    //         'X-Mailer': 'Nest Mailer',
    //       },
    //       from: '"No Reply" <noreply@example.com>',
    //     },
    //     template: {
    //       dir: join(__dirname, './templates'),
    //       adapter: new HandlebarsAdapter(),
    //       options: {
    //         strict: true,
    //       },
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),
  ],
  providers: [MailService],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
