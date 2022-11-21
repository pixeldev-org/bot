import {
  Client,
  ClientOptions,
} from 'discord.js';
import { Tracer, colorConsole } from 'tracer';
import { PrismaClient } from '@prisma/client';
import {
  createClient, RedisClientOptions,
  RedisClientType, RedisDefaultModules,
  RedisFunctions, RedisModules,
  RedisScripts,
} from 'redis';
import LoggerConfig = Tracer.LoggerConfig;

import CommandManager from './CommandManager';
import EventManager from './EventManager';
import ScheduleManager from './ScheduleManager';
import { BotOptions } from './structures/types';

/** The main Bot class */
export default class Bot {
  /** The options passed to create this bot */
  readonly options: BotOptions;

  /** The Discord Client for this bot */
  readonly client: Client<true>;

  /** The CommandManager for this bot */
  readonly commands: CommandManager;

  /** The EventManager for this bot */
  readonly events: EventManager;

  /** The ScheduleManager for this bot */
  readonly schedules: ScheduleManager;

  /** The Logger for this bot */
  readonly logger: Tracer.Logger<'log' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'>;

  /** The Prisma client for this bot */
  readonly prisma: PrismaClient;

  /** The redis client for this bot  */
  readonly redis: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;

  constructor(clientOptions: ClientOptions, loggerConfig: LoggerConfig, botOptions: BotOptions, redisClientOptions: RedisClientOptions) {
    this.options = botOptions;
    this.client = new Client(clientOptions);
    this.commands = new CommandManager(this);
    this.events = new EventManager(this);
    this.schedules = new ScheduleManager(this);
    this.logger = colorConsole(loggerConfig);
    this.prisma = new PrismaClient({ datasources: { db: { url: botOptions.database } } });
    this.redis = createClient(redisClientOptions);
  }

  public async start(): Promise<Bot> {
    this.logger.log('Starting...');
    await this.client.login(this.options.token);
    this.logger.info('Logged into Discord.');
    await this.prisma.$connect();
    await this.schedules.init();
    await this.events.init();
    await this.commands.init();

    await this.redis.connect();
    this.logger.log(`Connected to redis at ${this.redis.options?.url}`);

    await this.redis.set('test', 'test');

    this.logger.log(`The bot has started! Prefixes: '${this.options.prefixes}'`);

    return this;
  }
}
