const { readdirSync, readFileSync } = require("fs");

const { Collection, Client, GatewayIntentBits, EmbedBuilder, Partials, Colors, REST, Routes } = require('discord.js');

const { token, guildId, clientId } = require('./config.json');

// ? // // // // // // // // // // // // // // // // // // // // //

const client = new Client({
	intents: [
		GatewayIntentBits.MessageContent, 
		GatewayIntentBits.Guilds, 
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages, 
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const rest = new REST({ version: '10' }).setToken(token);

// ? // // // // // // // // // // // // // // // // // // // // //

client.login(token).then(console.clear);

client.once('ready', async () => {

	// ? Set variables

	client.features = new Collection();
	client.commands = new Collection();

	process.ownerId = '348547981253017610';
	process.guild = await client.guilds.fetch(guildId);
	process.logChannel = await process.guild.channels.fetch('1030541153541566465');

	// ? Initializing

	const feature_files = readdirSync('./features').filter(file => file.endsWith('.js') && !file.startsWith('_'));
	
	console.log('\n! Features');

	for (const file of feature_files)
	{
		const name = file.slice(0,-3);
		try 
		{
			const module = require(`./features/${file}`);
			if(module.initialize) await module.initialize();
			client.features.set(name, module);
			console.log(`   ✓ ${name}`);
		} 
		catch (err) 
		{
			console.log(`   ✗ ${name}`);
			console.log(`      ${err.toString()}`)
		}
	}

	console.log('\n! Commands');
	
	const slashCommands = {};
	const command_files = readdirSync('./commands').filter(file => file.endsWith('.js') && !file.startsWith('_'));
	const registerSlashCommands = process.argv[2] === '--refresh';

	for (const file of command_files)
	{
		const command = require(`./commands/${file}`);
		const name = file.slice(0,-3);

		client.commands.set(name, command);

		try 
		{
			if(command.initialize) await command.initialize(client)

			console.log(`   ✓ ${name}`);

			// ? Validate command
			if(command.interact === undefined)
			{
				console.log(`       ✗ interact not found`);
			}

			// ? Validate slash command
			if(!command.builder && !command.builders)
			{
				console.log(`       ✗ builder not found`);
			}

			if(command.interact === undefined || (!command.builder && !command.builders))
			{
				continue;
			}

			command.available = true;

			// ? Register slash command

			if(registerSlashCommands)
			{
				const ids = command.guildIds || [ command.guildId ];
				const builders = command.builders || [ command.builder ];

				if(builders.length > 1)
				{
					client.commands.delete(name);
				}

				builders.forEach(builder => {
					client.commands.set(builder.name, command);
					ids.forEach(id => {
						id = id || 'global';
						slashCommands[id] = slashCommands[id] || [];
						slashCommands[id].push(builder.toJSON());
					});
					console.log(`       / ${builder.name}`);
				});
			}
		} 
		catch (err) 
		{
			console.log(`   ✗ ${name}`);
			console.log(`      ${err.toString()}`)
		}
	}

	if(registerSlashCommands)
	{
		for (const key in slashCommands) 
		{
			if(key === 'global')
			{
				await rest
					.put(Routes.applicationCommands(clientId), { body: slashCommands[key] })
					.then((data) => console.log(`\n! Registered ${data.length} global slash commands`))
					.catch(err => console.log(JSON.stringify(err, null, 2)));
			}
			else
			{
				await rest
					.put(Routes.applicationGuildCommands(clientId, key), { body: slashCommands[key] })
					.then((data) => console.log(`\n! Registered ${data.length} guild slash commands`))
					.catch(err => console.log(JSON.stringify(err, null, 2)));
			}
		}
	}

	console.log('\n ! Finished');
});

// ? // // // // // // // // // // // // // // // // // // // // //

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
	
	client.features.each(feature => {
		if(!feature.tick) return;
		try {
			feature.tick(message);
		} catch (error) {
			console.log(error);
		}
	});
});

const sorryErrOcc = { content: '☹️ Sorry, an error occured. Please try again later.', ephemeral: true };

const sorryUnavailable = { content: `☹️ Sorry, this command is currently unavailable. Please try again later.`, ephemeral: true };

client.on('interactionCreate', async (interaction) => {

	const command = client.commands.get(interaction.commandName);
	
	if (interaction.isChatInputCommand())
	{
		if(!command)
		{
			// ! Impossible to get here unless
			// ? The api changes
			// ? There is an unregistered command
			// ? If 2 interactions from separate places call the same interaction?
			return interaction.reply({ content: `☹️ Sorry, that command does not exist.`, ephemeral: true });
		}

		if(!command.available)
		{
			return interaction.reply(sorryUnavailable);
		}

		await interaction.deferReply({ ephemeral: command.ephemeral || false });

		try {
			const out = (await command.interact(interaction));

			if(!out) 
			{
				await interaction.editReply(sorryUnavailable);
				return;
			}

			const options = out.content || out.embeds? out : { 
				content: out instanceof EmbedBuilder? '' : out, 
				embeds: out instanceof EmbedBuilder? [out] : []
			};

			options.ephemeral = command.ephemeral || out.ephemeral || false;

			return await interaction.editReply(options);
		} 
		catch (error) {
			return await interaction.editReply(sorryErrOcc);
		} 
	}

	if (interaction.isAutocomplete())
	{
		try {
			const data = command.autocomplete(interaction);
			if(!data) return await interaction.respond([{ name: 'none', value: null }]);
			return await interaction.respond(data);
		} 
		catch { 
			return await interaction.respond([{ name: 'none', value: null }]);
		}
	}
});
