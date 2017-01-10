// ==UserScript==
// @name         Speeldoos uploader
// @namespace    https://github.com/MrHernicle/speeldoos-uploader
// @version      0.1.0
// @author       MrHernicle at PTH
// @include      http*://*passtheheadphones.me/upload.php*
// @grant        none
// ==/UserScript==

(function()
{
	'use strict';

	var with_jquery = function( $ )
	{
		// TODO: Configuration or something.

		var dropzone;
		var create_form;

		var artist_priorities = {
			"Main": "1",
			"Guest": "2",
			"Composer": "4",
			"Conductor": "5",
			"DJ": "6",
			"Compiler": "6",
			"Remixer": "3",
			"Producer": "7"
		};

		var importXml = function(xml)
		{
			// Clear artists
			while ( $("#artistfields input").length > 1 )
				RemoveArtistField();

			// Fill composers
			var composers = {};
			$(">Performances>Performance>Work>Composer>Name", xml).each(function(_, x)
			{
				composers[x.textContent] = 1;
			});
			var artist_count = 0;
			for ( var c in composers )
			{
				if ( artist_count > 0 )
					AddArtistField();
				$("#artistfields input:last").val(c);
				$("#artistfields select:last").val(artist_priorities["Composer"]);
				artist_count++;
			}

			var perfs = $(">Performances>Performance", xml);
			var performers = {};
			perfs.each(function(_,p)
			{
				$(">Performers>Performer", $(p)).each(function(_,pp)
				{
					var name = pp.textContent;
					if ( !performers[name] )
					{
						performers[name] = { count: 0, role: "" };
					}
					if ( $(pp).attr("role") == "conductor" )
						performers[name].role = "Conductor";
					performers[name].count++;
				});
			});

			var min_count = Math.floor( perfs.length / 2 );
			for ( var pp in performers )
			{
				var priority = artist_priorities["Main"];
				if ( performers[pp].role == "Conductor" )
					priority = artist_priorities["Conductor"];
				else if ( performers[pp].count < min_count )
					priority = artist_priorities["Guest"];

				if ( artist_count > 0 )
					AddArtistField();
				$("#artistfields input:last").val(pp);
				$("#artistfields select:last").val(priority);
				artist_count++;
			}

			// Album title
			$("#title", create_form).val( $(">Name", xml).text() );

			// Catalog information
			var catalog = $(">ID", xml);
			$("#year").val(catalog.attr("Year")); // TODO
			$("#record_label").val(catalog.attr("Label")); // TODO
			$("#catalogue_number").val(catalog.text());

			// FIXME: Fill these fields in case of a remaster
			$("#remaster").prop("checked", false);
			$("#remaster_year").val("");
			$("#remaster_record_label").val("");
			$("#remaster_catalogue_number").val("");
			$("#remaster_true").toggleClass("hidden", true);

			$("#media").val(xml.attr("source"));
			$("#tags").val("classical");

			// Generate a tracklist
			var tracklist = "[b]Track list:[/b]\n";
			var cdtracks = {};
			$(">Performances>Performance>SourceFiles>File", xml).each(function(_, x)
			{
				var disc = "" + $(x).attr("disc");
				if ( !cdtracks[disc] )
					cdtracks[disc] = 1;
				else
					cdtracks[disc]++;
			});

			var multidisc = -1;
			for ( var disc in cdtracks )
			{
				multidisc++;
			};
			for ( var disc in cdtracks )
			{
				if ( multidisc )
				{
					if ( disc == "" || disc == "undefined" )
						tracklist += "CD1:\n";
					else
						tracklist += "CD"+disc+":\n";
				}
				var t = 1;
				$(">Performances>Performance", xml).each(function(_, x)
				{
					var tracks_here = $(">SourceFiles>File", $(x)).filter(function(_,y)
					{
						return ("" + $(y).attr("disc")) == disc;
					});
					if ( tracks_here.length == 0 ) return;

					var start = t;
					var end = t;
					var continued = false;
					$(">SourceFiles>File", $(x)).each(function(i, y)
					{
						if ( (""+$(y).attr("disc")) != disc )
						{
							if ( i == 0 )
								continued = true;
							return;
						}
						end++;
					});

					var opus = $(">Work>OpusNumber", x)[0]
					if ( opus )
					{
						if ( opus.getAttribute("IndexName") != undefined )
							opus = ", " + opus.getAttribute("IndexName") + " " + opus.textContent;
						else
							opus = ", Op. " + opus.textContent;
					}
					else
					{
						opus = "";
					}

					var tracks = start + "-" + (end-1);
					if ( start == (end-1) )
						tracks = start;

					tracklist += tracks + ": " +
						$(">Work>Composer>Name", x).text() +
						" - [i]" + $($(">Work>Title", x)[0]).text() + "[/i]" +
						opus + "\n";

					t = end;
				});

				if ( multidisc )
					tracklist += "\n";
			}

			$("#album_desc").val(tracklist);
		};

		var handleFiles = function()
		{
			var files = this.files;

			for ( var i = 0; i < files.length; i++ )
			{
				if ( files[i].type == "text/xml" )
				{
					var reader = new FileReader();
					reader.readAsText(files[i]);
					reader.onloadend = function(){
						importXml( $(reader.result) );
					};
				}
			}
		};

		var addDropzone = function()
		{
			if ( !document.getElementById("upload") )  return;

			dropzone = $("<input type=\"file\" />");
			dropzone.css({
				height: "100px",
				width: "400px",
				border: "4px solid #cccccc",
				backgroundColor: "#222222"
			});
			dropzone.change(handleFiles);

			$("#upload #content").prepend(dropzone);

			create_form = $("#upload form.create_form");
		};

		addDropzone();
	};

	if ( window.jQuery )
	{
		with_jquery( window.jQuery );
	}
	else
	{
		(function()
		{
			var script = document.createElement("script");
			script.setAttribute("src", "https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js");
			script.addEventListener('load', function()
			{
				var script = document.createElement("script");
				script.textContent = "(" + with_jquery.toString() + ")(jQuery.noConflict(true));";
				document.body.appendChild(script);
			}, false);
			document.body.insertBefore(script, document.body.firstChild);
		})();
	}
})();
