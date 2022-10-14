const { readdirSync, readFileSync } = require('fs');
const { parse } = require('yaml');
const { SlashCommandBuilder, SlashCommandStringOption, EmbedBuilder } = require("discord.js");

module.exports = {

    builder : new SlashCommandBuilder()
        .setName('recipe')
        .setDescription('Get a cocktail recipe')
        .addStringOption(
            new SlashCommandStringOption()
                .setName('cocktail')
                .setDescription('The cocktail name')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    interact({ options, member })
    {
        const name = options.getString('cocktail')[0].toUpperCase() + options.getString('cocktail').slice(1, -4);
        const cocktail = parse(readFileSync(`./data/cocktails/${options.getString('cocktail')}`, 'utf8'));

        const ingredients = cocktail.ingredients.map(v => ({
            cocktail: v,
            contents: this.getIngredient(v.name, v.type)
        }));
        
        console.log(ingredients);

        let embed = new EmbedBuilder()
            .setAuthor({ name })
            .addFields(
                ingredients.map(i => (
                    {
                        name: `${i.contents.type || ''}${i.contents.name}`, 
                        value: `$ ${(i.cocktail.amount ?? 750) / i.contents.cost}`,
                        indent: true
                    }
                ))
            )

        return embed;
    },

    getIngredient(name, type)
    {
        const dirs = readdirSync('./data/ingredients');

        for(const dir of dirs)
        {
            for(const _dir of readdirSync(`./data/ingredients/${dir}/`))
            {
                const json = parse(readFileSync(`./data/ingredients/${dir}/${_dir}`, 'utf8'));
                
                if(json.name !== name) continue;
                if(type && json.type !== type) continue;

                return json;
            }
        }
    }
}