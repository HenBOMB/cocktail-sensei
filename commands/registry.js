const { 
    SlashCommandBuilder, 
    SlashCommandStringOption, 
    EmbedBuilder, 
    SlashCommandIntegerOption
} = require("discord.js");

module.exports = {

    builder : new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register an item and save to database')
        .addStringOption(
            new SlashCommandStringOption()
                .setName('cocktail')
                .setDescription('The cocktail name')
                .setRequired(true)
        )
        .addStringOption(
            new SlashCommandIntegerOption()
                .setName('day')
                .setDescription('The day this happened')
                .setRequired(true)
                .setAutocomplete()
        )
        ,

    interact({ options, member })
    {

    },
}