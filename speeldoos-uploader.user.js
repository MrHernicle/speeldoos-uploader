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
			$("#title", create_form).val( $(">Name", xml).text() );

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
			for ( c in composers )
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
			for ( pp in performers )
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
