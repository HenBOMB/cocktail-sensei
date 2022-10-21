const { 
    SlashCommandBuilder, 
    SlashCommandStringOption, 
} = require("discord.js");

module.exports = {

    builder : new SlashCommandBuilder()
        .setName('help')
        .setDescription('View Cocktail Sensei\'s available tools & commands')
        .addStringOption(
            new SlashCommandStringOption()
                .setName('command')
                .setDescription('Get more info on this command')
                .setAutocomplete(true)
        ),

    interact({ options, member })
    {
        
    },

    autocomplete(interaction)
    {
        // TODO Maybe convert this to a dynamic list

        return [
            {
                name: 'recipe',
                value: 'recipe',
            },
            {
                name: 'example',
                value: 'example',
            }
        ];
    }
}