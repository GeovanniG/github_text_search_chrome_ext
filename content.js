/*
 * LocalStore key => "gh_search_text"
 *
 * FORMAT
 *      "gh_search_text" : {
 *          "text_search" : {
 *              "value" :  "SEARCH_STRING",
 *              "matches" : [ "FILENAME", "FILENAME" ]
 *          }
 *      }
 *
 * */



window.addEventListener ("load", main, false);


function clean_page()
{
    // clean table_elem
    var table_elem = document.getElementById("ext_matches");
    while (table_elem.hasChildNodes()){
        table_elem.removeChild(table_elem.firstChild);
    }
}


/* remove data from storage */
function clean_data()
{
}

function store_last_search(text_search, matches)
{
    data = {};
    data["text_search"] = {"value": text_search, "matches" : matches };
    // TODO add history
    window.localStorage.setItem("gh_text_search" , JSON.stringify(data))
}


function highlight_matches_on_current_file()
{
    // get current location/path
    var window_path = window.location.pathname;

    // TODO must be changed, this is a work around
    // split using 'master', the second item is  the real path + filename
    var tmp = window_path.split('master');

    // remove '/'
    var current_file = tmp[1].substring(1);
    console.log(current_file);


    var ext_data = JSON.parse(window.localStorage.getItem("gh_text_search"));
    if (ext_data["text_search"] === null)
        return;

    var search_for = ext_data["text_search"]["value"];
    var matches    = ext_data["text_search"]["matches"];


    if (matches.indexOf(current_file) <= -1)
        return;

    console.log("You are searching for " + search_for);

    /*
    // stackoverflow : https://stackoverflow.com/questions/16251505/how-to-highlight-all-text-occurrences-in-a-html-page-with-javascript
    // get all SPAN elems with class name "pl-c"
    // non è detto che vada bene.. forse è meglio fare con la richiesta del file
    var file_rows = document.getElementsByClassName("pl-c");

    // for each search the text, if you found it add class name
    for ( i = 0; i < file_rows.length; i++)
    {
        // get text and search match
        var row_content = file_rows[i].textContent;

        console.log(row_content);

        if (row_content.indexOf(search_for) > -1)
        {
            console.log("match found!!!");
            file_rows[i].style.backgroundColor = 'light-blue';
        }

    }

    */
    window.find()
}


function show_matches(matches)
{

    var table_elem = document.getElementById("ext_matches");
    if (table_elem != null)
    {
         for (i = 0; i < matches.length; i++)
         {
            var row_elem = table_elem.insertRow(i);
            row_elem.className += "js-navigation-item";

            var text_elem = document.createTextNode(matches[i]);
            var a_elem = document.createElement("a");
            a_elem.appendChild(text_elem);
            a_elem.style.marginLeft =  '10px';


            var path_name = window.location.pathname;
            var items = path_name.split("/");
            var href_value = items[2]+'/blob/master/'+matches[i];
            a_elem.setAttribute('href', href_value);

            row_elem.appendChild(a_elem);
         }

    } else {
        console.log("not found");
    }
}



function do_search()
{
    var content = document.getElementById("ext_search_bar").value;

    // clean match result table
    clean_page();

    if (content == "")
      return;

    var gh_request = new XMLHttpRequest();
    gh_request.onreadystatechange = function() {

        if (this.readyState == 4 && this.status == 422) {
            // console.log("No results");
			return;
        }

        if (this.readyState == 4 && this.status == 200) {

            var data_json =  eval("(" + this.responseText + ")");
            var elements = document.getElementsByClassName("js-navigation-open");

            var matches = [];

            for (i = 0; i < data_json["total_count"]; i++)
            {

                var tmp = data_json["items"][i]["path"];
                matches.push(data_json["items"][i]["path"]);
            }

            store_last_search(content, matches);

            show_matches(matches);
        }
    };

    var path_name = window.location.pathname;
    var items = path_name.split("/");

    var url_query ='https://api.github.com/search/code?q=' + content;
    url_query += "+in:file+repo:"+items[1]+"/"+items[2];

    gh_request.open("GET", url_query, true);
    gh_request.send();

}

function create_match_container()
{
    var matches_div = document.createElement("div");
    matches_div.setAttribute('class', 'ext_matchs_div');
    matches_div.className += " boxed-group clearfix announce";

    var title_h3 = document.createElement("h3");
    var text = document.createTextNode("Matches");
    title_h3.appendChild(text);

    var file_wrap_div = document.createElement('div');
    file_wrap_div.setAttribute('class', 'file-wrap');

    // create table
    var table_elem = document.createElement("table");
    table_elem.setAttribute('id', 'ext_matches');
    table_elem.className += "files js-navigation-container js-active-navigation-container";

    file_wrap_div.appendChild(table_elem);
    matches_div.appendChild(title_h3);

    matches_div.appendChild(file_wrap_div);
    return matches_div;

}


function keypress_handler(event)
{
    // enter has keyCode = 13, change it if you want to use another button
    if (event.keyCode == 13) {
        do_search();
        return false;
    }
}

function create_ext_search_div(file_nav_node)
{

        var search_div = document.createElement("div");
        search_div.className += "file";

        var container_div = document.createElement("div");
        container_div.setAttribute('id', 'ext_search_container')
        container_div.setAttribute('class', 'file-header');

        var search_label = document.createElement("label");
        var label_text = document.createTextNode("Search for: ");

        var input = document.createElement("input");
        input.setAttribute('type', 'text');
        input.setAttribute('id', 'ext_search_bar');
        input.setAttribute('class', 'form-control');
        input.setAttribute('placeholder', 'Search into code');

        input.addEventListener("keypress", keypress_handler);

        container_div.appendChild(label_text);
        container_div.appendChild(input);

        search_div.appendChild(container_div);
        var file_wrap_div = document.createElement('div');

        // create table
        var table_elem = document.createElement("table");
        table_elem.setAttribute('id', 'ext_matches');
        table_elem.className += "files js-navigation-container js-active-navigation-container";

        file_wrap_div.appendChild(table_elem);

        search_div.appendChild(file_wrap_div);

        file_nav_node.parentNode.insertBefore(search_div, file_nav_node);
        document.getElementById("ext_search_container").style.marginLeft = "auto";
        document.getElementById("ext_search_container").style.marginRight = "auto";

}


function main(evt) {

    var file_nav = document.getElementsByClassName("commit-tease");
    if (file_nav)
    {

        if (window.localStorage.getItem("gh_text_search") === null)
        {
            // create it empty
            window.localStorage.setItem("gh_text_search", "");
        }

        var file_div = document.getElementsByClassName("file");

		// if exists element with class file probably we're in a page
		// with content file, so do no show the search bar
        if (file_div.length > 0)
        {
            // do not show search bar
            // but try to highlight the matches
            highlight_matches_on_current_file();
            return;
        }
        create_ext_search_div(file_nav[0]);
    }

}
