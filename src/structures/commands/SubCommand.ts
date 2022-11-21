import { MessageEmbed } from 'discord.js';

import AbstractCommand from './AbstractCommand';
import Command, { CommandSubclass } from './Command';
import Bot from '../../Bot';
import CommandSource from './CommandSource';
import { SubclassConstructor } from '../types';

export type SubCommandSubclass = SubclassConstructor<typeof SubCommand>;

/** An abstract SubCommand belonging to a Command parent. */
export default abstract class SubCommand extends AbstractCommand {
  constructor(bot: Bot, source: CommandSource, prefix: string, parent: typeof Command) {
    super(bot, source, prefix);
    this.getConstructor().parentCommand = parent;
  }

  /** This subcommand's parent */
  public static parentCommand: CommandSubclass;

  /** Get an embed about this subcommand's usage */
  public static override getUsage(prefix: string): MessageEmbed {
    const name = this.data.names[0];

    const embed = new MessageEmbed()
      .setAuthor({ name: `❔ Showing usage of ${prefix}${this.parentCommand.data.names[0]} ${name}` })
      .setDescription(this.data.description)
      .setColor(this.data.defaultColor || this.parentCommand.data.defaultColor)
      .addFields({
        name: 'Usage',
        value: `\`${prefix}${this.parentCommand.data.names[0]} ${name}${this.data.usage ? ` ${this.data.usage}` : ''}\``,
        inline: true,
      });

    if (this.data.userPerms) {
      embed.addFields({
        name: 'Required Permissions',
        value: `\`${this.data.userPerms.join('`, `')}\``,
        inline: true,
      });
    }
    if (this.data.names.length > 1) {
      embed.addFields({
        name: 'Aliases',
        value: this.data.names.slice(1).map((alias) => `\`${alias}\``).join(', '),
      });
    }
    return embed;
  }
}
