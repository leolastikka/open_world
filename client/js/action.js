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
  constructor(text, networkId)
  {
    super(text);
    this.networkId = networkId;
  }
}

class TalkAction extends InteractAction
{
  constructor(text, networkId)
  {
    super(text);
    this.networkId = networkId;
  }
}

class AttackAction extends InteractAction
{
  constructor(text, networkId)
  {
    super(text);
    this.networkId = networkId;
  }
}
