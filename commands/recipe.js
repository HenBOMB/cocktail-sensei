const { readdirSync, readFileSync } = require('fs');
const { parse } = require('yaml');
const { 
    SlashCommandBuilder, 
    SlashCommandStringOption, 
    EmbedBuilder 
} = require("discord.js");

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
        
        let total = 0;
        let fileds = ingredients.map(i => {
            let cost = (i.contents.cost / (i.contents.amount ?? 750)) * (i.cocktail.amount || 1);
            total += cost;
            return {
                name: `${i.contents.type || ''}${i.contents.name}`, 
                value: `$ ${Math.ceil(cost)}`,
                inline: true
            }
        });

        fileds.push({
            name: `Total`, 
            value: `$ ${this.round(total)}`
        });

        let embed = new EmbedBuilder()
            .setAuthor({ name })
            .addFields(fileds)

        return embed;
    },

    getIngredient(name, type)
    {
        let found = { cost: 0 };

        for(const dir of readdirSync('./data/ingredients'))
        {
            for(const subdir of readdirSync(`./data/ingredients/${dir}/`))
            {
                const json = parse(readFileSync(`./data/ingredients/${dir}/${subdir}`, 'utf8'));
                
                if(json.name !== name) continue;

                if(type && json.type && json.type !== type) continue;

                if(found.cost > json.cost) continue;

                found = json;
            }
        }

        if(!found)
        {
            throw Error(`Missing ingredient: ${name} / ${type || 'none'}`);
        }
        
        return found;
    },

    round : (num) => 50 * Math.ceil(num / 50),

    autocomplete(interaction)
    {
        return readdirSync('./data/cocktails/')
            .filter(choice => choice.toLowerCase().includes(interaction.options.getFocused().toLowerCase()))
            .map(choice => {
                let name = choice.replace(/_/g, ' ');
                return {
                    name: name[0].toUpperCase() + name.slice(1,-4),
                    value: choice,
                }
            });
    }
}