'use client'

import * as React from 'react'
import BoardCard from './boardCard'
import { Circle, Pencil } from 'lucide-react'
import { ChangeEvent, useEffect, useState } from 'react'
import { useBoard } from '@/context/boardContext'
import GetBoardById from '@/lib/boards/getBoardById'
import { useTask } from '@/context/taskContext'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import UpdateTask from '@/lib/task/updateTask'
import Spinner from '@/assets/spinner'
import BoardInput from './boardInput'
import DropdownFilter from './dropdownFIlter'
import { useFilter } from '@/context/filterContext'

const statusOptions = [
  { status: 'Pendente', circleColor: 'gray' },
  { status: 'Em andamento', circleColor: 'purple' },
  { status: 'Feito', circleColor: 'green' },
]

export const priorityOptions = [
  { name: 'Alta', color: 'red' },
  { name: 'Média', color: 'yellow' },
  { name: 'Baixa', color: 'green' },
]

export default function Board() {
  const { boardId } = useBoard()
  const { setTaskData, taskData } = useTask()
  const { theme } = useTheme()
  const queryClient = useQueryClient()
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const { setFilterValue } = useFilter()
  const { boardName } = useBoard()

  const { data: boardData, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => GetBoardById({ id: boardId }),
    retry: false,
  })

  const { mutate } = useMutation({
    mutationFn: UpdateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
    },
  })

  useEffect(() => {
    if (boardData) {
      setTaskData(boardData.data.tasks || [])
    }
  }, [boardData, setTaskData])

  const taskCounts = statusOptions.reduce(
    (acc, option) => {
      acc[option.status] = taskData.filter(
        (task) => task.status === option.status,
      ).length
      return acc
    },
    {} as { [key: string]: number },
  )

  const handleUpdateTaskStatus = (
    id: number,
    status: string,
    {
      title,
      description,
      priority,
    }: { title: string; description: string; priority: string },
  ) => {
    mutate({
      description,
      title,
      priority,
      status,
      id,
    })
  }

  const handleColumnDrop = (
    e: React.DragEvent<HTMLDivElement>,
    status: string,
  ) => {
    e.preventDefault()
    const id = parseInt(e.dataTransfer.getData('taskId'), 10)
    const description = e.dataTransfer.getData('description')
    const title = e.dataTransfer.getData('title')
    const priority = e.dataTransfer.getData('priority')
    handleUpdateTaskStatus(id, status, { title, description, priority })
    setDragOverColumn(null)
  }
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilterValue(e.target.value)
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }
  return (
    <main className="flex flex-1 p-4 lg:gap-6 lg:p-6 relative">
      <div className="flex flex-col items-start">
        <div className="flex flex-col ml-20">
          <div className="flex items-center mb-4 gap-4 ">
            <h1 className="text-2xl font-bold">{boardName}</h1>
            <div className="flex items-center bg-indigo-500 p-2 rounded-lg cursor-pointer h-7 w-7">
              <Pencil size={18} />
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <BoardInput handleInputChange={handleInputChange} />
            <DropdownFilter />
          </div>
        </div>
        <div className="flex mt-8">
          {statusOptions.map(({ status, circleColor }) => (
            <div
              key={status}
              className={`flex flex-col ml-20 pb-5 items-center bg-muted/40 ${theme === 'dark' ? 'bg-muted/40' : 'bg-gray-300'} rounded w-[20rem] ${dragOverColumn === status ? 'border-2 border-indigo-500' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragOverColumn(status)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleColumnDrop(e, status)}
            >
              <div className="flex items-center justify-center gap-2 mt-4 mb-2">
                <Circle size={18} color={circleColor} fill={circleColor} />
                <p
                  className={`text-md font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-800'}`}
                >
                  {status} ( {taskCounts[status]} )
                </p>
              </div>
              <div className="flex items-center flex-col gap-5 mt-3">
                {taskData
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <BoardCard
                      key={task.ID}
                      taskId={task.ID}
                      data={task}
                      priority={task.priority}
                      createdAt={task.CreatedAt}
                      statusOption={statusOptions}
                      priorityOptions={priorityOptions}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
