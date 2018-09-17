export interface IObserver
{
    update(): void;
}

export interface ISubject
{
    registerObserver(observer: IObserver): void;
    removeObserver(observer: IObserver): void;
    notifyObservers(delta: number): void;
}

export class Subject implements ISubject
{
    public observerList: IObserver[] = [];

    public registerObserver(observer: IObserver): void
    {
        this.observerList.push(observer);
    }

    public removeObserver(observer: IObserver): void
    {
        const index: number = this.observerList.indexOf(observer);
        if(index >= 0)
        {
            this.observerList.splice(index, 1);
        }
    }

    public notifyObservers(delta: number): void
    {
        for (const observer of this.observerList)
        {
            observer.update();
        }
    }
}
