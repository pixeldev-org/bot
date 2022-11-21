import {
  ApplicationCommandOptionData,
  MessageEmbed,
} from 'discord.js';

import Command, { CommandSubclass } from './Command';
import SubCommand, { SubCommandSubclass } from './SubCommand';
import { SubclassConstructor } from '../types';

export type ParentCommandSubclass = SubclassConstructor<typeof ParentCommand>;

/** A template class representing a ParentCommand Command (Command which contains subcommands) */
export default abstract class ParentCommand extends Command {
  /** The executed subcommand */
  subCommand!: SubCommand;

  /** List of Subcommand Classes belonging to this Command */
  static getSubCommands(): SubCommandSubclass[] {
    return [];
  }

  static override getOptions(): ApplicationCommandOptionData[] {
    return this.getSubCommands().map((c) => {
      // ? We're mapping all the subcommands, so it's a valid usage here
      // eslint-disable-next-line no-param-reassign
      c.parentCommand = this as unknown as CommandSubclass;
      return {
        type: 'SUB_COMMAND',
        name: c.data.names[0],
        description: c.data.description,
        options: c.getOptions(),
      } as ApplicationCommandOptionData;
    });
  }

  static override getUsage(prefix: string): MessageEmbed {
    const name = this.data.names[0];
    const embed = new MessageEmbed()
      .setDescription(this.data.description)
      .setColor(this.data.defaultColor)
      .setAuthor({ name: `❔ Showing usage of ${prefix}${name}` })
      .addFields({
        name: 'Subcommands',
        value: `${this.getSubCommands().map((sc) => `\`${sc.data.names}\``).join(', ')}`,
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

  /** Get the executed subcommand */
  public getSubCommand(name: string): SubCommand | null {
    if (this.subCommand) return this.subCommand;

    for (const SC of (this.getConstructor() as unknown as typeof ParentCommand).getSubCommands()) {
      if (SC.data.names.includes(name)) {
        this.subCommand = new SC(this.bot, this.source, this.prefix, this.getConstructor());
        return this.subCommand;
      }
    }
    return null;
  }

  override async execute() {
    this.getSubCommand((this.options).getSubcommand(false) as string);
    if (!this.subCommand) {
      await this.sendUsage();
      return;
    }
    // @ts-ignore Typescript doesn't detect well that SubCommand is still a subclass of AbstractCommand, so it can access `options`
    this.subCommand.options = this.options;
    await this.subCommand.execute();
  }
}
