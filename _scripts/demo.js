<!--

/*  ************************************************************************  *
 *                                  demo.js                                   *
 *  ************************************************************************  */

/*  Load this script from the HEAD of any document page that wants it. The 
    DEFER attribute is recommended. 

    Load MASTER.JS and DOCUMENT.JS first. Then load CONTROLS.JS, optionally 
    with the DEFER attribute. Familiarity with all three is assumed. 

    Use of this script may require attention to a Content-Security-Policy, 
    specifically to add 'unsafe-eval unsafe-inline' to the script-src.  */

/*  ************************************************************************  */
/*  Background  */

/*  This script eases the inclusion of expandable demonstrations in a 
    document. Each demonstration is some arbitrary amount of script which is 
    not wanted in the ordinary flow of text but which the reader is invited 
    to reveal and run, if in the mind for diversion. 

    A DIV with the class name "Demonstration" may have an ID that describes 
    the example. 

    The DIV is to contain a SCRIPT block, disguised as a PRE block with the 
    class name "Script", plus explanatory text for readers who do not have 
    scripting enabled. The ID of the script block names the function to run 
    for the demonstration.  */

/*  ************************************************************************  */
/*  Configuration  */

/*  Every element in the Demonstration container has a class. These must 
    agree with DEMO.CSS. Some also act as defaults for such things as text 
    to show on buttons.  */

Config.DemoClasses = {
    Demonstration : "Demonstration",
    Run : "Run", 
    Status : "Status", 
    Script : "Script"
};

/*  The author's PRE block of source code is eventually given the usual 
    paragraph style for source code (to show in a tooltip). This class name 
    is defined in DOCUMENT.CSS.  */

Config.DocumentClasses.Source = "source";

/*  ************************************************************************  */
/*  Implementation  */

function DemoScript (ScriptNode, FunctionName, FunctionCode)
{
    var func = null;
    this.Run = function () {
        if (func == null) {
            func = new Function (FunctionName + "();");
            ScriptNode.text = FunctionCode;
        }
        func ();
    };
}

function DemoControls (DemoName, Source, Script)
{
    /*  We pick up the basics of our implementation by inheriting from 
        ScriptedControls (in CONTROLS.JS).  */

    ScriptedControls.call (this);

    // this.AppendControl (Control) from ScriptedControlsEx
    // this.InsertBeforeTargetNode (TargetNode) from ScriptedControlsEx
    // this.Disable from ScriptedControlsEx
    // this.Enable from ScriptedControlsEx

    var oshow = new ScriptedButton (
        "Show " + DemoName, 
        Config.ControlsClasses.Show, 
        true);

    var ohide = new ScriptedButton (
        "Hide " + DemoName, 
        Config.ControlsClasses.Hide, 
        false);

    var orun = new ScriptedButton ("Run", Config.DemoClasses.Run, false);

    var ostatus = new ScriptedStatus;

    this.AppendControl (oshow);
    this.AppendControl (ohide);
    this.AppendControl (orun);
    this.AppendControl (ostatus);

    var othis = this;

    var show = function (Event) {
        othis.Disable ();
        var operate = function () {
            Source.Show ();
            return true;
        };
        var complete = function () {
            oshow.Hide ();
            ohide.Show ();
            orun.Show ();
            ostatus.Hide ();
            othis.Enable ();
            return true;
        };
        var setfocus = function () {
            ohide.SetFocus ();
            return true;
        };
        RequestAnimationFrames (operate, complete, setfocus);
    };

    var hide = function (Event) {
        othis.Disable ();
        var operate = function () {
            Source.Hide ();
            return true;
        };
        var complete = function () {
            oshow.Show ();
            ohide.Hide ();
            orun.Hide ();
            ostatus.Hide ();
            othis.Enable ();
            return true;
        };
        var setfocus = function () {
            oshow.SetFocus ();
            return true;
        };
        RequestAnimationFrames (operate, complete, setfocus);
    };

    var run = function (Event) {

        /*  What the script will run is in general unknown. There are limits 
            to what we can support. But we might expect that the HTML author 
            intends something simple but perhaps unusual. Cases are known 
            that won't run as expected if run from a timeout handler. Run it 
            all in the click handler and damn the performance!  */

        ostatus.Hide ();
        othis.Disable ();
        ostatus.Hide ();
        var e;
        try {
            Script.Run ();
        }
        catch (e) {
            ostatus.Show (e);
        }
        othis.Enable ();
        var setfocus = function () {
            ohide.SetFocus ();
        };
        RequestAnimationFrame (setfocus);
    };

    oshow.SetClickHandler (show);
    ohide.SetClickHandler (hide);
    orun.SetClickHandler (run);
}

/*  ************************************************************************  */
/*  Load-Time Preparation  */

function CreateDemo (Div, Pre)
{
    /*  The HTML author can specify a name to show on the Show and Hide 
        controls. This is done as the ID attribute on the DIV. The default 
        is simply Demonstration.  */

    var demoname = Config.DemoClasses.Demonstration;
    id = Div.id;
    if (id) demoname += " (" + id + ")";

    /*  The script is the content of the PRE node. The ID attribute names a 
        function to call for the demonstration. The default is Run.  */

    var funcname = Pre.id;
    if (!funcname) funcname = Config.DemoClasses.Run;

    var functext = GetNodeText (Pre);
    if (functext == null) return;

    /*  The script must define the function. If only for now, we don't 
        provide that the function is called with any arguments. Require that 
        the author define the function straightforwardly with no arguments 
        and specifically with just the one space between the keyword and the 
        function name and then one more before the parentheses.  */

    if (functext.indexOf ("function " + funcname + " ()") == -1) return;

    var doc = window.document;
    var script = doc.createElement ("SCRIPT");
    script.type = "text/javascript";
    script.text = "";

    /*  We have two targets operated by one set of controls. The source code 
        is simply shown and hidden, such that the basic ShowHideTarget from 
        CONTROLS.JS suffices.  */

    var osource = new ShowHideTarget (Pre, Config.DocumentClasses.Source, false);
    var oscript = new DemoScript (script, funcname, functext);
    var ocontrols = new DemoControls (demoname, osource, oscript);
    ocontrols.InsertBeforeTargetNode (Pre);

    var scriptdiv = window.document.createElement ("DIV");
    scriptdiv.className = Config.DemoClasses.Script;
    Div.insertBefore (scriptdiv, Pre);
    scriptdiv.appendChild (script);
    scriptdiv.appendChild (Pre);
}

function ConfigureDemo (Div)    // actually forEach callback
{
    /*  Code for the script is in a PRE block whose CLASS is Script. We 
        allow for only one such block and we expect it to be an immediate 
        child of the DIV, but it will typically be preceded by explanatory 
        text. Better to ask the browser once for all PRE blocks in the DIV 
        than to risk multiple calls for a search.  */

    var scriptclass = Config.DemoClasses.Script;
    var callback = function (Element) {
        return Element.parentNode == Div && ElementClassContains (scriptclass);
    };
    var pre = CollectionFind (Div.getElementsByTagName ("PRE"), callback);
    if (pre != null) CreateDemo (Div, pre);
}

function ConfigureDemos (Viewer)
{
    /*  A page can have multiple demonstrations, each in its own DIV whose 
        CLASS is Demonstration.  */

    var divs = Viewer.DocFrame.getElementsByTagName ("DIV");

    /*  What the browser gives us is a live collection of DIV elements. 
        Configuring a DIV as a Demonstration creates another DIV and thus 
        may affect the collection. At first, make a list of DIV elements 
        that look to be demonstrations. Then configure them each in turn.  */

    var demos = ExtractFromCollectionByClass (
        divs, 
        Config.DemoClasses.Demonstration);

    CollectionForEach (demos, ConfigureDemo);
}

/*  ************************************************************************  */
/*  Initialisation  */

/*  As well as the usual check that we have the use of scripts in MASTER.JS 
    and DOCUMENT.JS, we also depend on objects that are implemented in 
    CONTROLS.JS.  */

function CanInitialiseDemos () 
{
    return typeof IsMasterJsGood == "function" && IsMasterJsGood (window)
        && typeof Viewer == "function" 
        && typeof Viewer.CallWhenInserted == "function" 
        && typeof ScriptedControls == "function";
}

if (CanInitialiseDemos ()) {

    SetObjectInheritance (DemoControls, ScriptedControls);

    /*  We might add a listener for the document's load event, but we might 
        then configure the boxes only to have that DOCUMENT.JS fails at 
        building the viewer. Instead, register to be called back when the 
        viewer is ready.  */

    Viewer.CallWhenInserted (ConfigureDemos);
}

/*  ************************************************************************  *
 *        Copyright © 2007-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->