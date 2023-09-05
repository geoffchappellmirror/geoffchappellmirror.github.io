<!--

/*  ************************************************************************  *
 *                                tableset.js                                 *
 *  ************************************************************************  */

/*  Load this script from the HEAD of any document page that wants it. The 
    DEFER attribute is recommended. 

    Load MASTER.JS and DOCUMENT.JS first - in that order. Then load 
    CONTROLS.JS and TABLE.JS - in either order, with or without the DEFER 
    attribute. Familiarity with all these scripts is assumed.  */

/*  ************************************************************************  */
/*  Background  */

/*  This script makes a TABLE interactive, not just to show and hide under 
    user-interface control, but also to present as a set of smaller tables. 

    The HTML author need no very little of this. What's expected of the 
    markup is 

        DIV CLASS="TableSet"
            arbitrary nodes, typically for explanatory text 
            TABLE CLASS="Deferred class"
                CAPTION, optionally 
                COLGROUP, optionally 
                THEAD, optionally 
                TFOOT, optionally 
                TBODY TITLE="set1"
                TBODY TITLE="set2"
                ...

    Here, class and set1, set2, etc., are placeholders. 

    The Deferred in the TABLE CLASS is optional but recommended. With it, 
    the TABLE is hidden even before this script is loaded. (A possible 
    ill-effect is that if TABLESET.JS then for some reason doesn't run, the 
    TABLE remains hidden.)

    If scripts (specifically DOCUMENT.JS) don't run at all, then Deferred 
    has no effect and the reader sees the whole table (just as does the HTML 
    author when writing it).

    The main work for the HTML author is to categorise the table's rows into 
    rowgroups, each as a TBODY with an optional (but highly recommended) 
    TITLE. The scripts then offer to present each TBODY as a separate table, 
    often described below as a category table: 

        TABLE CLASS="class" 
            COLGROUP, optionally 
            THEAD, optionally 
            TFOOT, optionally 
            TBODY TITLE="set1"

    See that each category table is semantically correct as if it had been 
    written separately on purpose. Its COLGROUP, THEAD and TFOOT are 
    reproduced from the original TABLE. 

    Each category table is preceded by its own controls to show and hide 
    just this table. The original table is preceded by controls to show and 
    hide the original table or to present the table in categories. The 
    reader only ever sees the original table or a sequence of categories, 
    never both concurrently. 

    A small embellishment is that the TABLE class can include Alphabetised 
    or Categorised. These affect the names on some buttons. For instance, 
    Categorised makes explicit that the category tables are referred to as 
    categories on the table's control buttons and that Uncategorised is the 
    default on buttons for any TBODY that has no TITLE.  */

/*  ************************************************************************  */
/*  Configuration  */

/*  Styling is done through a separate stylesheet, TABLESET.CSS. CLASS names 
    must agree between the script and stylesheet. For more CLASS names that 
    are relevant, see CONTROLS.JS.  */

Config.TableSetClasses = {
    TableSet : "TableSet", 
    Alphabetised : "Alphabetised", 
    Categorised : "Categorised", 
    Tables : "Tables", 
    Table : "Table", 
    Expand : "Expand", 
    Collapse : "Collapse" 
};

/*  EXPERIMENTAL  */

Config.TableSetButtons = {
    ShowTable : "Show Table", 
    HideTable : "Hide Table", 
    ShowTables : "Show Categories", 
    ExpandAll : "Expand All", 
    CollapseAll : "Collapse All", 
    HideAll : "Hide All"
};

Config.TableSetButtonsAlphabetised = {
    ShowTable : "Show Table", 
    HideTable : "Hide Table", 
    ShowTables : "Show By First Letter", 
    ExpandAll : "Expand All", 
    CollapseAll : "Collapse All", 
    HideAll : "Hide All"
};

Config.TableSetButtonsCategorised = {
    ShowTable : "Show Table", 
    HideTable : "Hide Table", 
    ShowTables : "Show Categories", 
    ExpandAll : "Expand All Categories", 
    CollapseAll : "Collapse All Categories", 
    HideAll : "Hide All Categories"
};

Config.TableSetCategories = {
    None : "Uncategorised"
};

/*  ************************************************************************  */
/*  A Hack for Document Frame Width  */

/*  Ideally, this script is running only because the BODY of the document 
    page that has the Table Set has been reworked into a DIV - with DocFrame 
    as its ID - that presents the document as a paper page centred in a 
    document panel (that is most of the browser window but shares it with 
    other panels for a banner and a table of contents). 

    The simulated paper page is as wide as any of its content, most of 
    which is constrained to some maximum to avoid unreadably long lines. 
    Tables do not have this constraint. Whenever we show a table, whether 
    the TABLE as written or any that we extract from it, the page may have 
    to widen. Because the page is centred, it moves. This unsightly widening 
    and moving can't be avoided when we're to show a table that doesn't fit, 
    but what we can avoid is movement from shrinking the page when tables 
    get hidden. 

    Our aim for this hack is that the widest that has yet been needed for 
    the DocFrame is retained as a min-width.  */

function TableSetWidthManager ()
{
    var docframe = window.document.getElementById (Config.ViewerIds.DocFrame);
    if (docframe == null) return;

    /*  This is so much harder than seems sensible, at least in part because 
        HTML and CSS tend to measure differently and the DOM anyway doesn't 
        expose the CSS measurements very helpfully. 

        Since we'll be setting the CSS min-width property, CSS's measure is 
        what we want. But even the getComputedStyle method for modern 
        browsers gives us a string with units. It is at least guaranteed to 
        be an absolute value, but must it be pixels? For now, we assume it 
        must.  */

    var getwidth;
    if (window.getComputedStyle != null) {
        getwidth = function () {
            var style = window.getComputedStyle (docframe);
            return parseInt (style.width);
        };
    }
    else {

        /*  Without getComputedStyle - from DOM2 in 2000, so it is indeed a 
            wonder not to have it before Internet Explorer 9, something like 
            a decade later - measurement gets very awkward. The Internet 
            Explorer currentStyle property is as likely to give "auto" for 
            the width, which is hardly helpful. 

            Such measures as scrollWidth are readily available for all 
            browsers. But what scrollWidth measures is the padding box, not 
            the content box that CSS wants. 

            The following hack will do for now: the DocFrame is known to be 
            styled with 2em of padding on both left and right and the font 
            is styled with 1em = 14px.  */

        getwidth = function () {
            return docframe.scrollWidth - 2 * 28;
        };
    };

    var minwidth = 0;
    this.Update = function () {
        var width = getwidth ();
        if (width > minwidth) {
            minwidth = width;
            docframe.style.minWidth = width + "px";
        }
    };
}

/*  ************************************************************************  */
/*  Simple Show/Hide With No Category Tables  */

/*  In the basic configuration, the TABLE is written with just one TBODY. 
    There are no categories to separate the TABLE into. There is just the 
    one TABLE to show and hide. 

    We need very little more than a pair of Show and Hide buttons as a 
    ShowHideControls (implemented in CONTROLS.JS) to operate on the TABLE as 
    a slight derivation of a ShowHideTarget (also in CONTROLS.JS).  */

function SimpleTableSetTarget (TableNode, Class, WidthManager)
{
    /*  Except for having the Width Manager, we would use a ShowHideTarget 
        directly. Instead, inherit.  */

    ShowHideTarget.call (this, TableNode, Class, false);

    // this.Show () from ShowHideTarget
    // this.Hide () from ShowHideTarget

    /*  We have just the one reason for inheritance: pre-process the Hide 
        method so that hiding the TABLE does not narrow the DocFrame.  */

    var basehide = this.Hide;
    this.Hide = function () {
        WidthManager.Update (TableNode.scrollWidth);
        basehide.call (this);
    };
}

/*  ************************************************************************  */
/*  Table Separation  */

/*  The TableSetHeadings is a keeper of the heading nodes that are to be 
    reproduced in each category TABLE.  */

function TableSetHeadings (HeadingNodes)
{
    /*  Our caller tells us of the nodes that are children of the original 
        TABLE but which precede the first TBODY (or TR). These typically 
        include text nodes but can, if only in principle, include such 
        things as SCRIPT and TEMPLATE nodes. Decide now which ones are to 
        get cloned to every category table.  */

    var headingnodes = new Array;

    var count = HeadingNodes.length;
    for (var n = 0; n < count; n ++) {
        var node = HeadingNodes [n];

        /*  We explicitly do not clone text nodes. 

            TO DO: Or comment nodes? How far do we take this?  */

        if (node.nodeType == 3) continue;

        switch (node.nodeName) {

            /*  We explicitly do not clone the CAPTION.  */

            case "CAPTION": continue;

            /*  All the formally defined types of node to expect in a TABLE 
                before the first TBODY must be cloned.  */

            case "COLGROUP":
            case "COL":
            case "THEAD": 
            case "TFOOT": {
                headingnodes.push (node);
                break;
            }
        }

        /*  If only for now, our default is anyway not to clone.  */
    }

    count = headingnodes.length;

    /*  Call the Clone method any number of times to clone each of the 
        selected nodes into an empty TABLE node. 

        The intention is that the empty TABLE node is that of a category 
        table. It perhaps does not need to be empty, but it is here assumed 
        to have no TBODY yet. It perhaps does not need to be a TABLE node - 
        but let's leave that as another story.  */

    this.Clone = function (TableNode) {

        /*  TO DO:

            Calling the DOM to clone a node (and its descendants) surely has 
            no small cost. Investigate cloning the nodes once into some 
            container so that cloning them all can thereafter be done in one 
            call to clone the container. Then they can be appended to the 
            given TABLE from the container. We'd have the same number of 
            calls to appendChild but fewer to cloneNode. But we'd have to 
            pick the cloned nodes from the container. Would we gain? 

            If the container could be a document fragment, then surely yes. 
            Otherwise, no?  */

        for (var n = 0; n < count; n ++) {
            TableNode.appendChild (headingnodes [n].cloneNode (true));
        }
    };
}

/*  The TableSetTbody is the keeper of all input for generating a category 
    TABLE. This input is in two parts: the headings that are common to all 
    category tables; the TBODY that is specifc to this category table.  */

function TableSetTbody (Headings, TbodyNode)
{
    /*  At various stages, but even quite early, we'll want to show 
        something of this TBODY node's size. Even before then, we want to 
        show the TABLE node's size - to which the TBODY contributes. The 
        obvious measure is a count of items. 

        Items are what the user perceives as being listed in the table. An 
        item starts with a row whose first cell is a TD in the first column. 
        The item's description in columns to the right may have some 
        complexity, notably to spread the item over multiple rows. This 
        shows in two ways: the first cell in the item's first row has 
        ROWSPAN > 1; the first cell in the item's subsequent rows is for 
        some column to the right.  */

    var itemcount = 0;

    var rownodes = TbodyNode.rows;
    var rowcount = rownodes.length;
    for (var n = 0; n < rowcount; n ++) {
        var rownode = rownodes [n];

        var cellnodes = rownode.cells;
        if (cellnodes.length < 1) continue;
        var cellnode = cellnodes [0];

        var height = cellnode.rowSpan;
        if (height -- > 1) n += height;

        if (cellnode.tagName == "TD") itemcount ++;
    };

    /*  We use the item count internally but also expose it to the 
        TableSetTableTarget and thence to the TableSetTable. (See below for 
        both.)  */

    this.GetItemCount = function () {
        return itemcount;
    };

    /*  Each category needs a name for its show/hide controls. Ideally, the 
        HTML author sets this as the TITLE attribute of the TBODY, perhaps 
        because having it show a tooltip over this part of the TABLE is 
        helpful anyway. 

        The name gets appended to Show and Hide on the controls. A small 
        elaboration is that we add an item count in parentheses. This 
        doubles as a default when the HTML author has not set a TITLE.  */

    this.ComposeName = function (Class) {

        var getbase = function () {
            var base = TbodyNode.title;
            if (!base) {
                if (ClassNameContains (Class, Config.TableSetClasses.Categorised)) {
                    base = Config.TableSetCategories.None;
                }
                else {
                    base = "";
                }
            }
            return base;    
        };

        var name = getbase ();
        if (name == "") {
            if (itemcount != 0) name = "(" + itemcount + ")";
        }
        else {
            if (itemcount  != 0) name += " (" + itemcount + ")";
        }
        return name;
    };

    /*  Since the category TABLE is formed from only one TBODY in the TABLE 
        as written in the HTML, there's no small chance that one or more 
        columns of the category TABLE contain nothing that needs to show. 
        When we have populated the new TABLE, but preferably while it is not 
        in the document, we can remove such columns from showing. 

        This is perhaps not surprisingly expensive - on the order of 10ms 
        for a table with hundreds of rows - but as bells and whistles go, it 
        is as much to be desired as empty columns are not.  */

    var trimtable = function (TableNode) {

        /*  You might think the browser, through implementing the DOM, gives 
            us a ready reckoning of a table's cells by row and column. But 
            it doesn't and so we do our own mapping of the new TABLE by row 
            and column. For this, we need our helper script for tables, 
            TABLE.JS, and its TableMap object.  */

        if (typeof (TableMap) != "function") return;

        var tablemap = new TableMap (TableNode);

        /*  Find which columns have only white space in their data cells. 

            TO DO: 

            This is ripe for generalisation. For instance, a column might 
            usefuly be removed from showing if all it's intended for is 
            numerical data but all its data cells contain 0.  */

        var isempty = function (Node) {

            /*  Given the preparation of content by Expression Web, what we 
                have in practice for a data cell that we intend as empty is 
                a single text node that contains a non-breaking space. But 
                let's not insist on it. 

                Whatever we look for in the content, take care to avoid any 
                technique that triggers style calculations - as would an 
                examination of the node's innerText.  */

            var text = GetNodeText (Node);;
            if (text == null) return false;

            /*  A regular-expression test for whether the whole of this text 
                is zero or more white-space characters would suffice except 
                that early Internet Explorer (version 8 and earlier) doesn't 
                count the non-breaking space as white space. A single 
                non-breaking space is so much expected that we may as well 
                make a special case of it anyway to avoid the overhead of a 
                regular-expression test.  */

            switch (text) {
                case "":
                case "\u00A0": return true;
            }

            return /^[\s]*$/.test (text);
        };

        var isemptyorisnotdatacell = function (Node) {
            return Node.nodeName != "TD" || isempty (Node);
        };

        var column = tablemap.GetWidth ();
        while (column -- != 0) {
            if (tablemap.EnumerateColumn (column, isemptyorisnotdatacell)) {

                /*  Even though visibility:collapse is among the few 
                    properties that the CSS standard allows for COL, the 
                    implementation in some browsers - even ones that are 
                    widely regarded as leaders in standards compliance - is 
                    so poor that we can't use it. To remove the empty 
                    columns from showing, we must delete the cells!  */

                tablemap.DeleteColumn (column);
            }
        }
    };

    this.Clone = function (NewTableNode) {

        /*  Populate the new TABLE. It's supposed to be empty. Removing it 
            from the DOM tree while we add to it should cost almost 
            nothing. Putting the possibly large and complex TABLE back in to 
            the DOM tree will be expensive but we gain because each of our 
            many operations on it will have been so much cheaper.  */

        var parent = NewTableNode.parentNode;
        var next = NewTableNode.nextSibling;
        parent.removeChild (NewTableNode);

        Headings.Clone (NewTableNode);
        NewTableNode.appendChild (TbodyNode.cloneNode (true));
        trimtable (NewTableNode);

        parent.insertBefore (NewTableNode, next);
    };
}

/*  ========================================================================  */

/*  The TableSetTables manages the set of category tables. It's what allows 
    the table set's controls to expand or collapse all the category tables, 
    and it's how those controls know whether the accumulation of operations 
    on each category table yet mean that all the tables are expanded or 
    collapsed.  */

function TableSetTables ()
{
    /*  Call the Register method for each category table's TableSetTable so 
        that this manager can operate on all category tables collectively, 
        e.g., to show all category tables.  */

    function TableManager (Target, Controls)
    {
        this.Target = Target;
        this.Controls = Controls;

        this.Execute = function (Handler) {
            Handler (this.Target, this.Controls);
        };
    };

    var atables = new Array;
    this.TableCount = 0;
    this.ItemCount = 0;

    this.Register = function (Target, Controls) {
        atables.push (new TableManager (Target, Controls));
        this.TableCount ++;
        this.ItemCount += Target.GetItemCount ();
    };

    /*  Call the OnShow and OnHide methods from a category table's 
        TableSetTable to tell this manager that a category table has been 
        shown or hidden. Note that these are merely placeholder 
        imlementations: they get redefined by the Activate method (next).  */

    var numshowing = 0;

    this.OnShow = function () {
        numshowing ++;
    };

    this.OnHide = function () {
        numshowing --;
    };

    /*  Call the SetStateCallbacks method from the original table's TableSet 
        so that the original table's controls can adjust to whether the 
        category tables are all expanded or all collapsed.  */

    this.SetStateCallbacks = function (OnAllExpanded, OnAllCollapsed) {

        this.OnShow = function () {
            if (numshowing == 0) OnAllCollapsed (false);
            numshowing ++;
            if (numshowing == atables.length) OnAllExpanded (true);
        };

        this.OnHide = function () {
            if (numshowing == atables.length) OnAllExpanded (false);
            numshowing --;
            if (numshowing == 0) OnAllCollapsed (true);
        };
    };

    /*  Call the Execute member to call the given Handler once for each 
        category table. Optionally provide an UpdateControls to call back 
        when done.  */

    this.Execute = function (Handler, Callback) {
        var count = atables.length;
        var n = 0;
        var execute = function () {
            if (n < count) {
                var start = GetTickCount ();
                do {
                    atables [n ++].Execute (Handler);
                    var elapsed = GetTickCount () - start;
                    if (elapsed >= 10) {
                        if (n < count) {
                            RequestAnimationFrame (execute); 
                            return;
                        }
                        break;
                    }
                } while (n < count);
                RequestAnimationFrame (Callback);
                return;
            }
            Callback ();
        };
        execute ();
    };
}

/*  ========================================================================  */
/*  Category Table From TBODY  */

/*  The TableSetTable models a single table in the table set, typically 
    representing one category of the much larger TABLE that's written in the 
    HTML. 

    Each category table has its own Show and Hide controls for showing and 
    hiding the TABLE as their target. The basic ShowHideControls from 
    CONTROLS.JS suffices for this. The target needs a bit more - for a few 
    reasons. 

    The immediate reason, even for the simplest implementation, is that the 
    category TABLE is empty until user-interface activity first asks to show 
    this category. The Show method's first execution must populate the 
    TABLE. 

    Another is that the TABLE can be shown and hidden independently of its 
    own controls. This is done by clicking on the Expand All or Collapse All 
    button in the controls for the whole table set. 

    One more reason the target is derived is that showing the TABLE by 
    clicking its Show button can mean that all category tables are now 
    showing, and so the Expand All button in the master controls would 
    better not show - and similarly for hiding and Collpse All. This 
    bookkeeping is done by the TableSetTables manager (above), but each 
    TableSetTable must communicate its change between showing and hiding.  */

function TableSetTableTarget (TableNode, Class, Tbody, Tables, WidthManager)
{
    ShowHideTarget.call (this, TableNode, Class, false);

    // this.Show () from ShowHideTarget
    // this.Hide () from ShowHideTarget

    this.GetItemCount = function () {
        return Tbody.GetItemCount ();
    };

    /*  The extra step of cloning a THEAD and TBODY from the original TABLE 
        is wanted only for the Show method's first use.  */

    var showing = false;

    var baseshow = this.Show;
    var show = function (External) {
        if (showing) return;
        baseshow.call (this);
        Tables.OnShow ();
        showing = true;
    };

    this.Show = function (External) {
        this.Show = show;
        Tbody.Clone (TableNode);
        show ();
    };

    var basehide = this.Hide;
    this.Hide = function (External) {
        if (!showing) return;
        if (!External) WidthManager.Update (TableNode.scrollWidth);
        basehide.call (this);
        Tables.OnHide ();
        showing = false;
    };
}

function TableSetTable (TableNode, Class, Tbody, Tables, WidthManager)
{
    var otarget = new TableSetTableTarget (
        TableNode, 
        Class, 
        Tbody, 
        Tables, 
        WidthManager);

    var ocontrols = new ShowHideControls (Tbody.ComposeName (Class));
    ocontrols.InsertBeforeTargetNode (TableNode);
    ocontrols.ConnectTarget (otarget);

    this.Register = function (Tables) {
        Tables.Register (otarget, ocontrols);
    };
}

/*  ========================================================================  */
/*  The Table Set  */

function 
TableSetTarget (
    TableNode, 
    Class, 
    TablesNode, 
    Tables, 
    WidthManager)
{
    var otable = new ShowHideTarget (TableNode, Class, false);

    var otables = new ShowHideTarget (
        TablesNode, 
        Config.TableSetClasses.Tables, 
        false);

    this.ShowTable = function (Callback) {
        RequestAnimationFrame (Callback);
        otables.Hide ();
        otable.Show ();
    };

    this.HideTable = function (Callback) {
        RequestAnimationFrame (Callback);
        WidthManager.Update (TableNode.scrollWidth);
        otable.Hide ();
    };

    this.ShowTables = function (Callback) {
        RequestAnimationFrame (Callback);
        WidthManager.Update (TableNode.scrollWidth);
        otable.Hide ();
        otables.Show ();
    };

    this.ExpandAll = function (Callback) {
        WidthManager.Update (TableNode.scrollWidth);
        otable.Hide ();

        var onupdated = function () {
            otables.Show ();
            Callback ();
        };

        var updatecontrols = function (Target, Controls) {
            Controls.Show ();
        };

        var onexpanded = function () {
            Tables.Execute (updatecontrols, onupdated);
        };

        var showtable = function (Target, Controls) {
            Target.Show (true);
        };

        var expandtables = function () {
            Tables.Execute (showtable, onexpanded);
        };

        RequestAnimationFrame (expandtables);
    };

    this.CollapseAll = function (Callback) {

        WidthManager.Update (TablesNode.scrollWidth);

        var updatecontrols = function (Target, Controls) {
            Controls.Hide ();
        };

        var oncollapsed = function () {
            Tables.Execute (updatecontrols, Callback);
        };

        var collapsetable = function (Target, Controls) {
            Target.Hide (true);
        };

        Tables.Execute (collapsetable, oncollapsed);
    };

    this.HideAll = function (Callback) {
        RequestAnimationFrame (Callback);
        WidthManager.Update (TablesNode.scrollWidth);
        otables.Hide ();
    };
}

/*  The master controls for the table set are something like the basic pair 
    of Show and Hide controls as modelled by ShowHideControls in CONTROLS.JS 
    but on steroids. We have six buttons, not two, to control a target that 
    is very much more complex. Still, like ShowHideControls, we inherit from 
    ScriptedControls and much of our script is patterned on that of 
    ShowHideControls.  */

function TableSetControls (Target, Class, Tables)
{
    ScriptedControls.call (this);

    // this.AppendControl (Control) from ScriptedControlsEx
    // this.InsertBeforeTargetNode (TargetNode) from ScriptedControlsEx
    // this.Disable from ScriptedControlsEx
    // this.Enable from ScriptedControlsEx

    /*  Helpers for labelling the buttons  */

    var appendcount = function (Base, Count) {
        return Count != 0 ? Base + " (" + Count + ")" : Base;
    };

    var iscategorised = ClassNameContains (Class, Config.TableSetClasses.Categorised);
    var isalphabetical = false;

    var labels;
    if (iscategorised) {
        labels = Config.TableSetButtonsCategorised;
    }
    else {
        isalphabetical = ClassNameContains (Class, Config.TableSetClasses.Alphabetical);
        if (isalphabetical) {
            labels = Config.TableSetButtonsAlphabetised;
        }
        else {
            labels = Config.TableSetButtons;
        }
    }

    /*  Define (and label) the six buttons.  */

    var oshowtable = new ScriptedButton (
        appendcount (labels.ShowTable, Tables.ItemCount), 
        Config.ControlsClasses.Show, 
        true);

    var ohidetable = new ScriptedButton (
        labels.HideTable, 
        Config.ControlsClasses.Hide,
        false);

    var oshowtables = new ScriptedButton (
        appendcount (labels.ShowTables, Tables.TableCount),
        Config.ControlsClasses.Show,
        true);

    var oexpandall = new ScriptedButton (
        labels.ExpandAll, 
        Config.TableSetClasses.Expand,
        true);

    var ocollapseall = new ScriptedButton (
        labels.CollapseAll,
        Config.TableSetClasses.Collapse,
        false);

    var ohideall = new ScriptedButton ( 
        labels.HideAll, 
        Config.ControlsClasses.Hide,
        false);

    this.AppendControl (oshowtable);
    this.AppendControl (ohidetable);
    this.AppendControl (oshowtables);
    this.AppendControl (oexpandall);
    this.AppendControl (ocollapseall);
    this.AppendControl (ohideall);

    /*  Variables and helpers for tracking state 

        The particular concern here is for whether to show or hide the 
        buttons that would Expand All or Collapse All. These buttons' 
        usefulness is not entirely in our own hands. For instance, we don't 
        want to show Expand All if the tables are already fully expanded,
        but that's something we learn from callbacks that we register with 
        the TableSetTables.  */

    var allexpanded = false;
    var allcollapsed = true;

    var showhideexpandall = function () {
        allexpanded ? oexpandall.Hide () : oexpandall.Show ();
    };

    var showhidecollapseall = function () {
        allcollapsed ? ocollapseall.Hide () : ocollapseall.Show ();
    };

    var executing = false;

    var onallexpanded = function (State) {
        allexpanded = State;
        if (!executing) showhideexpandall ();
    };

    var onallcollapsed = function (State) {
        allcollapsed = State;
        if (!executing) showhidecollapseall ();
    };

    Tables.SetStateCallbacks (onallexpanded, onallcollapsed);

    /*  Helper for handling button clicks 

        Clicking on any one button does something to the target, of course, 
        but then changes which other buttons are shown or hidden and which 
        has the focus (as most likely to be wanted next). 

        The common handler runs the given Operation at the Target and then 
        the given Completion locally (to change the states of buttons) and 
        ends by setting the focus to the Focus button.  */

    othis = this;

    var execute = function (Operation, Completion, Focus) {

        /*  We don't want the buttons to look (or be) clickable while we 
            work. We restore their interactivity once we've set their new 
            state.  */

        executing = true;
        othis.Disable ();

        /*  Break out the three stages of execution into callbacks. This 
            means we now read backwards.  */

        var setfocus = function () {
            Focus.SetFocus ();
        };
        var complete = function () {
            RequestAnimationFrame (setfocus);
            executing = false;
            Completion ();
            othis.Enable ();
        };
        var operate = function () {
            Operation.call (Target, complete);
        };
        RequestAnimationFrame (operate);
    };

    /*  Define how each of the six buttons handles being clicked on. 

        TO DO: 

        The handling for the six buttons, as defined below and in the 
        preceding helper, is inevitably still rough. There's perhaps still 
        quite a lot to do here for bells and whistles!  */

    var showtable = function (Event) {
        var oncompletion = function () {
            oshowtable.Hide ();
            ohidetable.Show ();
            oshowtables.Show ();
            showhideexpandall ();
            ocollapseall.Hide ();
            ohideall.Hide ();
        };
        execute (Target.ShowTable, oncompletion, ohidetable);
    };

    var hidetable = function (Event) {
        var oncompletion = function () {
            oshowtable.Show ();
            ohidetable.Hide ();
            oshowtables.Show ();
            showhideexpandall ();
            ocollapseall.Hide ();
            ohideall.Hide ();
        };
        execute (Target.HideTable, oncompletion, oshowtable);
    };

    var showtables = function (Event) {
        var oncompletion = function () {
            oshowtable.Show ();
            ohidetable.Hide ();
            oshowtables.Hide ();
            showhideexpandall ();
            showhidecollapseall ();
            ohideall.Show ();
        };
        execute (
            Target.ShowTables, 
            oncompletion, 
            allexpanded ? ocollapseall : oexpandall);
    };

    var expandall = function (Event) {
        var oncompletion = function () {
            oshowtable.Show ();
            ohidetable.Hide ();
            oshowtables.Hide ();
            oexpandall.Hide ();
            ocollapseall.Show ();
            ohideall.Show ();
        };
        execute (Target.ExpandAll, oncompletion, ocollapseall);
    };

    var collapseall = function (Event) {
        var oncompletion = function () {
            oshowtable.Show ();
            ohidetable.Hide ();
            oshowtables.Hide ();
            oexpandall.Show ();
            ocollapseall.Hide ();
            ohideall.Show ();
        };
        execute (Target.CollapseAll, oncompletion, oexpandall);
    };

    var hideall = function (Event) {
        var oncompletion = function () {
            oshowtable.Show ();
            ohidetable.Hide ();
            oshowtables.Show ();
            showhideexpandall (), 
            ocollapseall.Hide ();
            ohideall.Hide ();
        };
        execute (Target.HideAll, oncompletion, oshowtables);
    };

    /*  And now make those buttons interactive!  */

    oshowtable.SetClickHandler (showtable);
    ohidetable.SetClickHandler (hidetable);
    oshowtables.SetClickHandler (showtables);
    oexpandall.SetClickHandler (expandall);
    ocollapseall.SetClickHandler (collapseall);
    ohideall.SetClickHandler (hideall);
}

/*  The TableSet picks up from the TABLE as written. The caller has ensured 
    that the TABLE is hidden, and tells us the base CLASS (partly so that we 
    can more efficiently show and hide the TABLE, but especially as the 
    CLASS to reproduce if we split the TABLE into categories). 

    CODING NOTE: 

    Though TableSet is written as a constructor and is called as one, we 
    don't presently make use of this.  */

function TableSet (TableNode, Class, WidthManager)
{
    /*  The essence of the Table Set is that each TBODY can be made into its 
        own TABLE, each with clones of the heading nodes. 

        We don't care very much what the heading nodes are. A well-written 
        TABLE will have at most one each of a CAPTION, COLGROUP, THEAD and 
        TFOOT. Even if we won't ever use them, as happens if the TABLE turns 
        out to have only one TBODY, we don't lose much from finding them on 
        the way to the body nodes - and the expected authoring is that we 
        will have needed to find them. 

        All child nodes that precede the first TBODY are headings. After the 
        first TBODY, we care only for more bodies. A TABLE that has no TBODY 
        or which has a row that's not in a TBODY is here treated as 
        degenerate.  */

    var expandable = false;
    var aheadingnodes = new Array;
    var abodynodes = new Array;
    var doneheadings = false;
    var children = TableNode.childNodes;
    var count = children.length;
    for (var n = 0; n < count; n ++) {
        var p = children [n];
        if (p.nodeName == "TBODY") {
            if (doneheadings) expandable = true;
            doneheadings = true;
            abodynodes.push (p);
        }
        else if (p.nodeName == "TR") {
            expandable = false;
            break;
        }
        else {
            if (!doneheadings) aheadingnodes.push (p);
        }
    }

    /*  If we don't have more than one TBODY, we have the basic 
        configuration (and no need to have defined a Table Set). We anyway 
        fall back to this in some degenerate cases such as finding a TR 
        that's not in a TBODY.

        Insert some ordinary Show Table and Hide Table buttons before the 
        TABLE. Connect the TABLE as the target that the buttons show and 
        hide. If not for the embellishment of width management, we could do 
        this just with objects that are already defined in CONTROLS.JS.  */

    if (!expandable) {

        var otarget = new SimpleTableSetTarget (TableNode, Class, WidthManager);
        var ocontrols = new ShowHideControls ("Table");
        ocontrols.InsertBeforeTargetNode (TableNode);
        ocontrols.ConnectTarget (otarget);

        return;
    }

    /*  In the expected case, we rework the one TABLE such that each TBODY 
        becomes its own TABLE. Each such TABLE gets a clone of the 
        original's heading nodes and is preceded by its own pair of Show and 
        Hide controls. The whole is included in a DIV, which also can be 
        shown and hidden. 

        Some of this preparation, even much of it, could be deferred. We 
        must go as far as offering some controls, but except for knowing 
        that the TABLE has more than one TBODY, we needn't even look at any 
        TBODY yet. After all, the reader might never click on one of the 
        initial buttons. 

        A balance has been sought. The preparation here takes many tens of 
        milliseconds but not a hundred. Done here, the time does not matter 
        much - but it certainly would if added to all the other work that 
        starts at the first click of a button.  */

    var doc = window.document;
    var tablesdiv = doc.createElement ("DIV");

    var oheadings = new TableSetHeadings (aheadingnodes);
    var otables = new TableSetTables;

    count = abodynodes.length;
    for (var n = 0; n < count; n ++) {

        var table = doc.createElement ("TABLE");
        tablesdiv.appendChild (table);

        var otable = new TableSetTable (
            table, 
            Class, 
            new TableSetTbody (oheadings, abodynodes [n]), 
            otables, 
            WidthManager);

        /*  TO DO: 

            Might this read better as adding the otable to the otables?  */

        otable.Register (otables);
    }

    /*  Instead of the original TABLE as a simple show/hide target, we have 
        a complex target comprising the original TABLE, the DIV (which ends 
        up having Tables as its CLASS), and a sequence of control-and-target 
        pairs for each TBODY.  */

    var otarget = new TableSetTarget (
        TableNode, 
        Class, 
        tablesdiv, 
        otables, 
        WidthManager);

    var ocontrols = new TableSetControls (otarget, Class, otables);

    /*  The master controls precede both the original TABLE and the Tables 
        DIV. But let's have some flexibility about when to insert them.  */

    this.InsertControls = function () {
        ocontrols.InsertBeforeTargetNode (TableNode);
    };
    
    this.InsertTables = function () {
        TableNode.parentNode.insertBefore (tablesdiv, TableNode);
    };
}

/*  ************************************************************************  */
/*  Load-Time Preparation  */

function ConfigureTableSet (TableSetNode, WidthManager)
{
    /*  The Table Set to configure is a DIV whose CLASS is already known to 
        include TableSet. This DIV is expected to contain one and only one 
        TABLE.  */

    var tables = TableSetNode.getElementsByTagName ("TABLE");
    if (tables.length != 1) return;
    var table = tables [0];

    /*  Ideally, but not necessarily, the TABLE has Deferrable in its CLASS 
        such that it gets hidden (by DOCUMENT.JS) before this script runs. 
        The intention is that it shows if scripts don't run but otherwise 
        gets shown only through user-interface action on some control - 
        which is the business of this script to build and activate! 

        Take over the showing and hiding of the TABLE - but keep the TABLE 
        hidden. This means ensuring that the CLASS no longer has Deferrable 
        but instead has Hidden.  */

    var baseclass = ElementClassEnsure (
        table, 
        Config.ControlsClasses.Hidden, 
        Config.Classes.Deferrable);

    var tableset = new TableSet (table, baseclass, WidthManager);
    tableset.InsertControls ();
    tableset.InsertTables ();
}

function ConfigureTableSets (Viewer)
{
    var owm = new TableSetWidthManager;

    /*  Each table that is subject to this script's interactivity is in a 
        DIV that has a particular CLASS. We don't presently intend that 
        there will be more than one, but neither do we need to disallow it. 

        With no prescription of where any such DIV may be in the document, 
        we have little choice but to ask the browser for all DIV elements, 
        which we then check for suitability. What the browser gives us is a 
        live collection. Configuring any that's suitable may create yet more 
        DIV elements and thus affect the collection. So, take a first pass 
        over the collection to extract candidates. Then configure each in 
        turn.  */

    var divs = Viewer.DocFrame.getElementsByTagName ("DIV");

    var tablesets = ExtractFromCollectionByClass (
        divs, 
        Config.TableSetClasses.TableSet);

    var callback = function (Element) {
        ConfigureTableSet (Element, owm);
    };
    CollectionForEach (tablesets, callback);
}

/*  ************************************************************************  */
/*  Initialisation  */

/*  As well as the usual check that we have the use of scripts in MASTER.JS 
    and DOCUMENT.JS, we also depend on objects that are implemented in 
    CONTROLS.JS.  */

function CanInitialiseTableSets () 
{
    return typeof IsMasterJsGood == "function" && IsMasterJsGood (window) 
        && typeof Viewer == "function" 
        && typeof Viewer.CallWhenInserted == "function" 
        && typeof ScriptedControls == "function";
}

if (CanInitialiseTableSets ()) {

    /*  Notably, objects in this script sort-of inherit from objects that 
        are defined in CONTROL.JS. This requires a little preparation when 
        initialising.  */

    SetObjectInheritance (SimpleTableSetTarget, ShowHideTarget);
    SetObjectInheritance (TableSetTableTarget, ShowHideTarget);
    SetObjectInheritance (TableSetControls, ScriptedControls);

    /*  We might add a listener for the document's load event, but we might 
        then configure the boxes only to have that DOCUMENT.JS fails at 
        building the viewer. Instead, register to be called back when the 
        viewer is ready.  */

    Viewer.CallWhenInserted (ConfigureTableSets);
}

/*  ************************************************************************  *
 *        Copyright © 2021. Geoff Chappell. All rights reserved.              *
 *  ************************************************************************  */

//-->