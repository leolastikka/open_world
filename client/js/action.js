class Action
{
  constructor(text)
  {
    this.text = text;
  }
}

class WalkAction extends Action
{
  constructor(text, unitPos)
  {
    super(text);
    this.unitPos = unitPos;
  }
}

class InteractAction extends Action
{
  constructor(text, nid)
  {
    super(text);
    this.nid = nid;
  }
}

class AttackAction extends Action
{

}
