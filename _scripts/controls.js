<!--

/*  ************************************************************************  *
 *                                controls.js                                 *
 *  ************************************************************************  */

/*  Load this script from the HEAD of any document page that wants it. The 
    DEFER attribute is recommended. 

    Load MASTER.JS and DOCUMENT.JS first. Familiarity with both is assumed.  */

/*  TO DO: 

    Rework this script so that its objects, which are created in large 
    quantity for some pages, have methods on the prototype so that they are 
    created once for each type of object, not over and over for each 
    instance of an object.  */

/*  ************************************************************************  */
/*  Background  */

/*  The intention behind this script is to provide general support for other 
    scripts to make arbitrary content interactive, notably to show it or 
    hide it according to whether the user wants it. How this support mostly 
    shows is buttons, each as a control in a container of controls, that 
    operate on some target.  */

/*  ************************************************************************  */
/*  Configuration  */

/*  Some CLASS names which must agree with stylesheets that accompany any 
    scripts that use this one  */

Config.ControlsClasses = {

    /*  Any button or target is hidden or not according to which one of the 
        following two is in the node's CLASS. (In practice, the stylesheets 
        ignore Visible, and care only for whether Hidden in in the CLASS or 
        is not.)  */

    Visible : "Visible",
    Hidden : "Hidden",

    /*  The preceding classes are operated on controls that are broadly 
        classified as Show and Hide. In practice, these controls are 
        buttons. The stylesheets presently don't differentiate between Show 
        and Hide.  */

    Show : "Show", 
    Hide : "Hide", 

    /*  One special control is a text area for reporting any sort of 
        status.  */

    Status : "Status", 

    /*  Controls tend to be operated in pairs or groups. A node that 
        contains controls is given a distinctive class in case it helps with 
        styling.  */

    Controls : "Controls", 

    /*  The controls in a container can all be disabled, typically because 
        one of them has started a lengthy operation, by adding the following 
        to the container's CLASS. (Again in practice, stylesheets ignore 
        Enabled, and act instead on whether Disabled is in the CLASS or is 
        not.)  */

    Disabled : "Disabled", 
    Enabled : "Enabled"
};

/*  ************************************************************************  */
/*  Targets  */

/*  A ShowHideTarget models a DOM node that can be shown or hidden by a 
    user-interface action on some other node - a control - which may itself 
    also be a ShowHideTarget. 

    The showing and hiding is done by adding a prefix to the given node's 
    CLASS. If this is expected to be the only changing of the CLASS during 
    the node's lifetime, then greater efficiency is obtained by knowing this 
    CLASS all along.  */

function ShowHideTarget (Node, Class, Visible)
{
    var visible = Config.ControlsClasses.Visible;
    var hidden = Config.ControlsClasses.Hidden;

    /*  If we define the Show and Hide methods here, on the object, not its 
        prototype, we can free their implementations from testing for what 
        Class was specified at construction.  */

    var show;
    var hide;

    if (Class == null) {
        show = function () {
            ElementClassEnsure (Node, visible, hidden);
        };
        hide = function () {
            ElementClassEnsure (Node, hidden, visible);
        };
    }
    else {

        /*  Really do trust that the caller-supplied Class argument is the 
            className of the Node and does not already contain either of the 
            qualifiers for visible or hidden.  */

        if (Class != "") {
            visible += " " + Class;
            hidden += " " + Class;
        }
        show = function () {
            Node.className = visible;
        };
        hide = function () {
            Node.className = hidden;
        };
    }

    var showing = null;
    this.Show = function () {
        if (showing) return;
        show ();
        showing = true;
    };
    this.Hide = function () {
        if (showing == false) return;
        hide ();
        showing = false;
    };

    Visible ? this.Show () : this.Hide ();

    this.IsShowing = function () {
        return showing;
    };
}

/*  ********  */
/*  Controls  */

/*  A ScriptedControl models any HTML node that has some interactivty for 
    performing a command or at least of showing the result of some command. 
    Because the control may show or not, depending on whether the command is 
    possible at the time, a ScriptedControl is also a ShowHideTarget.  */

function ScriptedControl (Node, Class, Visible)
{
    /*  Inherit from ShowHideTarget. Remember to prepare for this in the 
        script's initialisation.  */

    ShowHideTarget.call (this, Node, Class, Visible);

    // this.Show () from ShowHideTarget
    // this.Hide () from ShowHideTarget

    /*  Call the following to append the control to some containing node. 
        (See the container classes below.)  */

    this.AppendToContainer = function (ContainerNode) {
        ContainerNode.appendChild (Node);
    };
}

/*  A BUTTON as a ScriptedControl  */

function ScriptedButton (Command, Class, Visible)
{
    /*  Create a BUTTON with the given Command as its text.  */

    var doc = window.document;
    var button = doc.createElement ("BUTTON");
    button.appendChild (doc.createTextNode (Command));

    /*  Some authorities around the Internet recommend setting "button" for 
        the TYPE attribute. There may be some history of browsers and 
        standards here: not only does Internet Explorer 7 regard "button" as 
        the default but it - and version 8.0 - raises an exception on trying 
        to set "button" as the "type" property.  */

    var e;
    try {
        button.type = "button";
    }
    catch (e) {
        button.setAttribute ("type", "button");
    }

    /*  Having prepared a BUTTON as a control, inherit from ScriptedControl. 
        Remember to prepare for this in the script's initialisation.  */

    ScriptedControl.call (this, button, Class, Visible);

    // this.Show () from ShowHideTarget
    // this.Hide () from ShowHideTarget
    // this.AppendToContainer (ContainerNode) from ScriptedControl

    /*  Call the SetClickHandler method to set an event handler that's to 
        fire when the BUTTON is clicked. The primary action expected for the 
        handler is to operate on some target that is known to this method's 
        caller. If performing this operation means the BUTTON is not useful, 
        then the handler will typically also call the inherited Hide method 
        to hide the BUTTON. 

        Call the Disable method to temporarily prevent the set Handler from 
        firing. Call Enable to restore it. The caller is responsible for 
        adjusting the button's appearance (the button very likely being one 
        of several that are affected, such that all are better affected 
        together). 

        CODING NOTE: 

        A BUTTON with its "disabled" property set to true supposedly does 
        not receive events. This is demonstrably not reliable for Internet 
        Explorer. If only in our particular use (which perhaps has the 
        complication of setting the property while already inside an event 
        handler), what's observed is that if the disabled BUTTON is clicked 
        on, then an event fires after the BUTTON is re-enabled. If instead 
        we disable the event by temporarily removing the handler, then we 
        observe no such delayed firing. 

        Temporarily removing the handler turns out anyway to be better for 
        our purposes. Setting "disabled" to true has two other effects. One 
        is that the button can't receive the focus. This constrains us (not 
        much) to setting the focus only after the controls are re-enabled. 
        The other side-effect is much more serious: the browser changes the 
        style. It's not a big recalculation but it's time added to the 
        handler. It's also not a restyling that we want. The control is 
        typically disabled as one of a set, and we restyle the set. */

    var handler = null;
    var cookie = null;
    this.Disable = function () {
        UnregisterEventHandler (button, "click", cookie);
    };
    this.Enable = function () {
        cookie = RegisterEventHandler (button, "click", handler);
    };

    this.SetClickHandler = function (Handler) {
        handler = Handler;
        this.Enable ();
    };

    /*  Call the following when the button is not just showing but should 
        have the keyboard focus. 

        Setting the focus is seen to force reflow. Best results are often 
        obtained by setting the focus before proceeding to any substantial 
        work. This is in some ways not a natural order. So, beware.  */

    this.SetFocus = function () {
        button.focus ();
    };
}

/*  The ScriptedStatus models an output area. It can be shown and hidden, 
    but it has no button. The point to showing it is to present some text. 

    The implementation is therefore derived from ScriptedControl but a little 
    differently from, and more simply than, a ScriptedButton.  */

function ScriptedStatus ()
{
    var doc = window.document;
    var p = doc.createElement ("P");
    var textnode = doc.createTextNode ("");
    p.appendChild (textnode);

    /*  Having prepared these nodes to act as a control, inherit from 
        ScriptedControl. Remember to prepare for this in the script's 
        initialisation.  */

    ScriptedControl.call (this, p, Config.ControlsClasses.Status, false);

    // this.Show () from ShowHideTarget
    // this.Hide () from ShowHideTarget
    // this.AppendToContainer (ContainerNode) from ScriptedControl

    /*  Override the inherited methods.  */

    var baseshow = this.Show;
    this.Show = function (Text) {
        textnode.nodeValue = Text;
        baseshow.call (this);
    };

    var basehide = this.Hide;
    this.Hide = function () {
        basehide.call (this);
        textnode.nodeValue = "";
    };
}

/*  ******************  */
/*  Control Containers  */

/*  A ScriptedControls models whatever DOM nodes are set up to contain any 
    number of controls, each modelled as a ScriptedControl (above). 

    Generally, the container may be any tree of nodes. One one inner node is 
    the parent of all controls and one outer node - the top of the tree - 
    gets inserted into the document.  */

function ScriptedControlsEx (OuterNode, InnerNode)
{
    /*  In the simplest case (as below for ScriptedControls without the Ex), 
        there is just the one node.  */

    if (InnerNode == null) InnerNode = OuterNode;

    /*  The inner node is typically not in the HTML as written. Its CLASS is 
        ours to choose. Assign it to Controls. Provide for a prefix to help 
        with styling the whole container when disabling or re-enabling all 
        the controls jointly.  */

    var controlsclass = Config.ControlsClasses.Controls;
    var enabledclass = Config.ControlsClasses.Enabled + " " + controlsclass;
    var disabledclass = Config.ControlsClasses.Disabled + " " + controlsclass;

    OuterNode.className = enabledclass;

    /*  Call the following to add a control to the container.  */

    var controls = new Array;

    this.AppendControl = function (Control) {
        Control.AppendToContainer (InnerNode);
        if (Control.SetClickHandler != null) controls.push (Control);
    };

    /*  Call the following to insert the controls container into the 
        document. The expectation is that the container immediately precedes 
        some node that is the target or is at least among the targets that 
        the controls act on.  */

    this.InsertBeforeTargetNode = function (TargetNode) {
        TargetNode.parentNode.insertBefore (OuterNode, TargetNode);
    };

    /*  Call the Disable and Enable methods to disable and re-enable all the 
        controls.  */

    this.Disable = function () {
        OuterNode.className = disabledclass;
        var count = controls.length;
        for (var n = 0; n < count; n ++) {
            controls [n].Disable ();
        }
    };

    this.Enable = function () {
        var count = controls.length;
        for (var n = 0; n < count; n ++) {
            controls [n].Enable ();
        }
        OuterNode.className = enabledclass;
    };
}

/*  The simplest contols container is a newly created DIV.  */

function ScriptedControls () 
{
    /*  Inherit from ScriptedControlsEx. Remember to prepare for this in the 
        script's initialisation.  */

    ScriptedControlsEx.call (this, window.document.createElement ("DIV"));

    // this.AppendControl (Control) from ScriptedControlsEx
    // this.InsertBeforeTargetNode (TargetNode) from ScriptedControlsEx
    // this.Disable () from ScriptedControlsEx
    // this.Enable () from ScriptedControlsEx
}

/*  ======================  */
/*  Show/Hide Control Pair  */

/*  A ShowHideControls is a container that is pre-populated with BUTTON 
    controls for the special purpose of showing and hiding something. Only 
    one BUTTON shows at a time and clicking on it changes to showing the 
    other BUTTON.  */

function ShowHideControls (Name) 
{
    /*  Inherit from ScriptedControls. Remember to prepare for this in the 
        script's initialisation.  */

    ScriptedControls.call (this);

    // this.AppendControl (Control) from ScriptedControlsEx
    // this.InsertBeforeTargetNode (TargetNode) from ScriptedControlsEx
    // this.Disable from ScriptedControlsEx
    // this.Enable from ScriptedControlsEx

    var oshow = new ScriptedButton (
        "Show " + Name, 
        Config.ControlsClasses.Show, 
        true);

    var ohide = new ScriptedButton (
        "Hide " + Name, 
        Config.ControlsClasses.Hide, 
        false);

    this.AppendControl (oshow);
    this.AppendControl (ohide);

    /*  Call the following to set handlers that are to fire when the 
        corresponding buttons are clicked.  */

    this.SetClickHandlers = function (Show, Hide) {
        oshow.SetClickHandler (Show);
        ohide.SetClickHandler (Hide);
    };

    /*  Call the following from the corresponding handlers to switch to the 
        other BUTTON.  */

    this.Show = function () {
        oshow.Hide ();
        ohide.Show ();
    };

    this.Hide = function () {
        oshow.Show ();
        ohide.Hide ();
    };

    /*  Alternatively, call the following to connect the controls to the 
        showing and hiding of a ShowHideTarget. The expected use is that the 
        Show and Hide buttons are the only controls, which are then 
        completely in charge.  */

    this.ConnectTarget = function (Target) {

        var othis = this;

        var execute = function (Operation, Completion, Focus) {
            othis.Disable ();
            var operate = function () {
                Operation.call (Target);
                return true;
            };
            var complete = function () {
                Completion.call (othis);
                othis.Enable ();
                return true;
            };
            var setfocus = function () {
                Focus.SetFocus ();
                return true;
            };
            RequestAnimationFrames (operate, complete, setfocus);
        };

        var show = function (Event) {
            execute (Target.Show, othis.Show, ohide);
        };

        var hide = function (Event) {
            execute (Target.Hide, othis.Hide, oshow);
        };

        this.SetClickHandlers (show, hide);
    };
}

/*  ************************************************************************  */
/*  Initialisation  */

function CanInitialiseControls () 
{
    return typeof (IsMasterJsGood) == "function" && IsMasterJsGood (window);
}

if (CanInitialiseControls ()) {

    /*  Prepare our simulation of inheritance for each object that depends 
        on it.  */

    SetObjectInheritance (ScriptedControl, ShowHideTarget);
    SetObjectInheritance (ScriptedButton, ScriptedControl);
    SetObjectInheritance (ScriptedStatus, ScriptedControl);
    SetObjectInheritance (ScriptedControls, ScriptedControlsEx);
    SetObjectInheritance (ShowHideControls, ScriptedControls);
}

/*  ************************************************************************  *
 *        Copyright © 2021-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->
